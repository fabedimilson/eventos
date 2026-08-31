import { Router, Response, Request } from 'express';
import { prisma } from '../prisma/client';
import { authMiddleware, requireEventOrganizerOrAdmin, AuthenticatedRequest } from '../middlewares/auth';
import { generateSha256, generateValidationCode } from '../utils/security';
import { createCertificatePdfBuffer } from '../utils/certificate-pdf';

export const certificatesRouter = Router();

// GET /api/v1/certificates/my (Certificados do usuário logado)
certificatesRouter.get('/my', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const certificates = await prisma.certificate.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            bannerUrl: true,
            primaryColor: true,
          },
        },
        session: {
          select: {
            id: true,
            title: true,
            speakerName: true,
            workloadHours: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return res.json({ certificates });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao buscar certificados.' });
  }
});

// GET /api/v1/certificates/validate/:validationCode (Público - Validação de autenticidade)
certificatesRouter.get('/validate/:validationCode', async (req: Request, res: Response) => {
  try {
    const { validationCode } = req.params;

    const certificate = await prisma.certificate.findUnique({
      where: { validationCode },
      include: {
        user: {
          select: { name: true, category: true, campus: true },
        },
        event: {
          select: { id: true, title: true, startDate: true, endDate: true, locationName: true },
        },
        session: {
          select: { id: true, title: true, speakerName: true, workloadHours: true },
        },
      },
    });

    if (!certificate) {
      return res.status(404).json({
        isValid: false,
        error: 'Certificado não encontrado no banco de registros do IFAM.',
      });
    }

    return res.json({
      isValid: certificate.status === 'ISSUED',
      certificate,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao consultar autenticidade do certificado.' });
  }
});

// GET /api/v1/certificates/:id/pdf (Download do arquivo PDF estilizado)
certificatesRouter.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cert = await prisma.certificate.findUnique({
      where: { id },
      include: {
        user: true,
        event: true,
        session: true,
      },
    });

    if (!cert) {
      return res.status(404).json({ error: 'Certificado não encontrado.' });
    }

    const activityTitle = cert.session ? `${cert.event.title} - ${cert.session.title}` : cert.event.title;

    const pdfBuffer = await createCertificatePdfBuffer({
      userName: cert.user.name,
      userCpf: cert.user.cpf,
      eventTitle: activityTitle,
      totalHours: cert.totalHoursAwarded,
      validationCode: cert.validationCode,
      sha256Hash: cert.sha256Hash,
      issuedAt: cert.issuedAt.toISOString(),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Certificado-IFAM-${cert.validationCode}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao gerar PDF do certificado.' });
  }
});

// POST /api/v1/certificates/events/:eventId/generate-batch (Organizador emite certificados para quem cumpriu presença)
certificatesRouter.post(
  '/events/:eventId/generate-batch',
  authMiddleware,
  requireEventOrganizerOrAdmin('event'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { eventId } = req.params;
      const { minAttendanceRate } = req.body;

      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          sessions: true,
          registrations: {
            include: { user: true },
          },
        },
      });

      if (!event) {
        return res.status(404).json({ error: 'Evento não encontrado.' });
      }

      const totalSessions = event.sessions.length;
      if (totalSessions === 0) {
        return res.status(400).json({ error: 'O evento não possui palestras cadastradas para computar presença.' });
      }

      const effectiveMinRate = minAttendanceRate !== undefined ? Number(minAttendanceRate) : (event.minAttendanceRate || 0.75);
      const sessionIds = event.sessions.map((s) => s.id);
      const totalEventHours = event.sessions.reduce((acc, s) => acc + s.workloadHours, 0);

      const issuedCertificates: any[] = [];

      for (const reg of event.registrations) {
        const userCheckIns = await prisma.checkIn.findMany({
          where: {
            userId: reg.userId,
            sessionId: { in: sessionIds },
            status: 'COMPLETED',
          },
          include: { session: true },
        });

        const userHours = userCheckIns.reduce((acc, c) => acc + c.session.workloadHours, 0);
        const attendanceRate = userCheckIns.length / totalSessions;

        if (attendanceRate >= effectiveMinRate) {
          const validationCode = generateValidationCode('IFAM-EVT');
          const hashPayload = `${reg.userId}:${eventId}:${validationCode}:${userHours}:${Date.now()}`;
          const sha256Hash = generateSha256(hashPayload);

          const certificate = await prisma.certificate.upsert({
            where: { validationCode },
            create: {
              eventId,
              userId: reg.userId,
              validationCode,
              sha256Hash,
              totalHoursAwarded: userHours > 0 ? userHours : totalEventHours,
              status: 'ISSUED',
            },
            update: {
              totalHoursAwarded: userHours > 0 ? userHours : totalEventHours,
              status: 'ISSUED',
            },
          });

          issuedCertificates.push(certificate);
        }
      }

      return res.json({
        message: `${issuedCertificates.length} certificado(s) emitido(s) com sucesso.`,
        issuedCount: issuedCertificates.length,
        certificates: issuedCertificates,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Erro ao emitir certificados em lote.' });
    }
  }
);
