import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { authMiddleware, requireEventOrganizerOrAdmin, AuthenticatedRequest } from '../middlewares/auth';
import { generateSessionQrToken, verifySessionQrToken, generateQrCodeDataUrl } from '../utils/qr';
import { generateSha256, generateValidationCode } from '../utils/security';

export const sessionsRouter = Router();

// GET /api/v1/sessions/:id (Detalhes da sessão e status de check-in do usuário logado)
sessionsRouter.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            certificateType: true,
            minAttendanceRate: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
        _count: { select: { checkIns: true } },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada.' });
    }

    const userCheckIn = await prisma.checkIn.findUnique({
      where: {
        sessionId_userId: {
          sessionId: id,
          userId: req.user!.userId,
        },
      },
    });

    return res.json({
      session,
      hasUserCheckedIn: Boolean(userCheckIn),
      userCheckIn,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao carregar detalhes da sessão.' });
  }
});

// GET /api/v1/sessions/:id/qr-current (Para o telão do organizador projetar o QR Code rotativo)
sessionsRouter.get(
  '/:id/qr-current',
  authMiddleware,
  requireEventOrganizerOrAdmin('session'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const session = await prisma.session.findUnique({ where: { id } });

      if (!session) {
        return res.status(404).json({ error: 'Sessão não encontrada.' });
      }

      const token = generateSessionQrToken(session.id, session.qrSecretKey);
      const qrPayload = JSON.stringify({
        sessionId: session.id,
        token,
        t: Date.now(),
      });

      const qrDataUrl = await generateQrCodeDataUrl(qrPayload);

      return res.json({
        sessionId: session.id,
        token,
        qrDataUrl,
        validForSeconds: 15,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Erro ao gerar QR Code da sessão.' });
    }
  }
);

// POST /api/v1/sessions/:id/checkin (O participante escaneia para Entrada ou Saída com regra de permanência)
sessionsRouter.post('/:id/checkin', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { qrToken, qrPayload, forcePrematureExit } = req.body;
    const userId = req.user!.userId;

    let tokenToVerify = qrToken;
    let sessionIdToVerify = id;

    if (qrPayload) {
      try {
        const parsed = typeof qrPayload === 'string' ? JSON.parse(qrPayload) : qrPayload;
        tokenToVerify = parsed.token || qrToken;
        sessionIdToVerify = parsed.sessionId || id;
      } catch (e) {
        // fallback
      }
    }

    if (!tokenToVerify) {
      return res.status(400).json({
        error: 'Token do QR Code não fornecido. Por favor, aponte a câmera para o telão oficial da palestra.',
      });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionIdToVerify },
      include: { event: true },
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão de palestra não encontrada.' });
    }

    // Validação estrita de token anti-fraude rotativo
    const isValid = verifySessionQrToken(session.id, session.qrSecretKey, tokenToVerify);
    if (!isValid) {
      return res.status(400).json({
        error: 'QR Code expirado ou inválido. Por favor, aponte a câmera para o telão novamente.',
      });
    }

    // Garante que o usuário está inscrito no evento
    await prisma.registration.upsert({
      where: {
        eventId_userId: {
          eventId: session.eventId,
          userId,
        },
      },
      create: {
        eventId: session.eventId,
        userId,
        code: `REG-${Date.now().toString(36).toUpperCase()}`,
      },
      update: {},
    });

    const existingCheckIn = await prisma.checkIn.findUnique({
      where: {
        sessionId_userId: {
          sessionId: session.id,
          userId,
        },
      },
    });

    // ----------------------------------------------------
    // CENÁRIO A: Check-in Duplo Ativado e já possui registro de entrada
    // ----------------------------------------------------
    if (existingCheckIn && existingCheckIn.status === 'IN_PROGRESS') {
      const now = new Date();
      const minutesElapsed = Math.max(1, Math.floor((now.getTime() - new Date(existingCheckIn.checkInAt).getTime()) / 60000));
      const minRate = session.event.minAttendanceRate || 0.75;
      const totalSessionMinutes = Math.max(15, session.workloadHours * 60);
      const requiredMinutes = Math.round(totalSessionMinutes * minRate);

      // Verificação de saída prematura
      if (minutesElapsed < requiredMinutes && !forcePrematureExit) {
        return res.status(200).json({
          prematureWarning: true,
          minutesElapsed,
          minutesRequired: requiredMinutes,
          minutesRemaining: requiredMinutes - minutesElapsed,
          sessionTitle: session.title,
          workloadHours: session.workloadHours,
          message: `Atenção: Você esteve presente por ${minutesElapsed} min. Ainda faltam ${requiredMinutes - minutesElapsed} min para atingir os ${Math.round(minRate * 100)}% de presença necessários para o certificado.`,
        });
      }

      const isCompleted = minutesElapsed >= requiredMinutes;
      const updatedCheckIn = await prisma.checkIn.update({
        where: { id: existingCheckIn.id },
        data: {
          checkOutAt: now,
          durationMinutes: minutesElapsed,
          status: isCompleted ? 'COMPLETED' : 'PREMATURE_EXIT',
        },
      });

      // Emite certificado modular da sessão se for modalidade PER_SESSION ou BOTH e atingiu a meta
      let certificate = null;
      if (isCompleted && (session.event.certificateType === 'PER_SESSION' || session.event.certificateType === 'BOTH')) {
        const validationCode = generateValidationCode('IFAM-SES');
        const hashPayload = `${userId}:${session.eventId}:${session.id}:${validationCode}:${session.workloadHours}:${Date.now()}`;
        const sha256Hash = generateSha256(hashPayload);

        certificate = await prisma.certificate.upsert({
          where: { validationCode },
          create: {
            eventId: session.eventId,
            userId,
            sessionId: session.id,
            validationCode,
            sha256Hash,
            totalHoursAwarded: session.workloadHours,
            status: 'ISSUED',
          },
          update: {},
        });
      }

      return res.status(200).json({
        message: isCompleted
          ? `Check-out concluído! Presença de ${session.workloadHours}h validada na atividade "${session.title}".`
          : `Saída antecipada registrada. Carga horária não homologada para certificação.`,
        checkIn: updatedCheckIn,
        sessionTitle: session.title,
        workloadHours: session.workloadHours,
        isCompleted,
        certificate,
      });
    }

    // ----------------------------------------------------
    // CENÁRIO B: Presença já estava concluída anteriormente
    // ----------------------------------------------------
    if (existingCheckIn && existingCheckIn.status === 'COMPLETED') {
      return res.status(200).json({
        message: `Presença de ${session.workloadHours}h já havia sido homologada anteriormente na atividade "${session.title}"!`,
        checkIn: existingCheckIn,
        alreadyCheckedIn: true,
        sessionTitle: session.title,
        workloadHours: session.workloadHours,
      });
    }

    // ----------------------------------------------------
    // CENÁRIO C: Primeiro Scan (Entrada)
    // ----------------------------------------------------
    const isDoubleRequired = session.requireDoubleCheckIn;
    const checkInStatus = isDoubleRequired ? 'IN_PROGRESS' : 'COMPLETED';

    const checkIn = await prisma.checkIn.upsert({
      where: {
        sessionId_userId: {
          sessionId: session.id,
          userId,
        },
      },
      create: {
        sessionId: session.id,
        userId,
        method: 'QR_CODE_SCAN',
        qrHashUsed: tokenToVerify.substring(0, 32),
        status: checkInStatus,
        checkInAt: new Date(),
      },
      update: {
        status: checkInStatus,
        checkInAt: new Date(),
      },
    });

    // Se não exige double check-in e for modalidade por sessão, já outorga o certificado
    let certificate = null;
    if (!isDoubleRequired && (session.event.certificateType === 'PER_SESSION' || session.event.certificateType === 'BOTH')) {
      const validationCode = generateValidationCode('IFAM-SES');
      const hashPayload = `${userId}:${session.eventId}:${session.id}:${validationCode}:${session.workloadHours}:${Date.now()}`;
      const sha256Hash = generateSha256(hashPayload);

      certificate = await prisma.certificate.upsert({
        where: { validationCode },
        create: {
          eventId: session.eventId,
          userId,
          sessionId: session.id,
          validationCode,
          sha256Hash,
          totalHoursAwarded: session.workloadHours,
          status: 'ISSUED',
        },
        update: {},
      });
    }

    return res.status(201).json({
      message: isDoubleRequired
        ? `Entrada confirmada na atividade "${session.title}"! Lembre-se de realizar o check-out no final da aula para validar suas ${session.workloadHours}h.`
        : `Presença confirmada com sucesso na palestra "${session.title}" (${session.workloadHours}h)!`,
      checkIn,
      sessionTitle: session.title,
      workloadHours: session.workloadHours,
      requireDoubleCheckIn: isDoubleRequired,
      certificate,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao registrar check-in.' });
  }
});

// POST /api/v1/sessions (Criar Sessão com YouTube Live/Gravação)
const sessionCreateSchema = z.object({
  eventId: z.string(),
  title: z.string().min(3),
  description: z.string().optional(),
  speakerName: z.string().min(2),
  speakerBio: z.string().optional(),
  speakerAvatar: z.string().optional(),
  room: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  workloadHours: z.number().default(1.0),
  requireDoubleCheckIn: z.boolean().default(false),
  youtubeLiveUrl: z.string().optional(),
  isLiveActive: z.boolean().default(false),
  recordingUrl: z.string().optional(),
});

sessionsRouter.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = sessionCreateSchema.parse(req.body);

    const session = await prisma.session.create({
      data: {
        ...data,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
      },
    });

    return res.status(201).json({ session });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erro ao criar sessão.' });
  }
});

