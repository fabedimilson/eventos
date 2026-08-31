import { Router, Response } from 'express';
import { prisma } from '../prisma/client';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middlewares/auth';

export const noticesRouter = Router();

// GET /api/v1/notices/active (Retorna o comunicado ativo para o campus do usuário ou visitante)
noticesRouter.get('/active', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user
      ? await prisma.user.findUnique({ where: { id: req.user.userId } })
      : null;
    const userCampus = user?.campus || 'Campus Manaus Centro';
    const userId = req.user?.userId;

    const notice = await prisma.notice.findFirst({
      where: {
        campus: userCampus,
        status: 'ACTIVE',
      },
      include: {
        acknowledgments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!notice) {
      return res.json({ notice: null });
    }

    const userAck = userId
      ? notice.acknowledgments.find((a) => a.userId === userId)
      : null;

    const totalAcks = notice.acknowledgments.filter((a) => a.status === 'ACKNOWLEDGED').length;
    const totalViews = notice.acknowledgments.length;

    return res.json({
      notice: {
        ...notice,
        hasAcknowledged: userAck?.status === 'ACKNOWLEDGED',
        hasDismissed: userAck?.status === 'DISMISSED',
        stats: {
          totalAcks,
          totalViews,
        },
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar comunicado ativo:', error);
    return res.status(500).json({ error: 'Erro ao buscar comunicado ativo.' });
  }
});

// POST /api/v1/notices (Cria novo comunicado oficial)
noticesRouter.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, severity, targetAudience, campus } = req.body;
    const user = req.user
      ? await prisma.user.findUnique({ where: { id: req.user.userId } })
      : null;
    const userCampus = campus || user?.campus || 'Campus Manaus Centro';

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        severity: severity || 'CRITICAL',
        campus: userCampus,
        targetAudience: targetAudience || 'TODOS',
        requiresAcknowledgment: true,
        publisherName: user?.name || 'Direção Geral',
        publisherRole: user?.category || 'DIREX / IFAM',
        status: 'ACTIVE',
      },
    });

    return res.status(201).json({ message: 'Comunicado publicado com sucesso!', notice });
  } catch (error: any) {
    console.error('Erro ao criar comunicado:', error);
    return res.status(500).json({ error: 'Erro ao publicar comunicado.' });
  }
});

// POST /api/v1/notices/:id/acknowledge (Registra ciência do usuário)
noticesRouter.post('/:id/acknowledge', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const ack = await prisma.noticeAcknowledgment.upsert({
      where: {
        noticeId_userId: {
          noticeId: id,
          userId,
        },
      },
      create: {
        noticeId: id,
        userId,
        userCategory: req.user?.category || 'USUARIO',
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
      },
      update: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
      },
    });

    return res.json({ message: 'Ciência registrada com sucesso no banco de dados!', acknowledgment: ack });
  } catch (error: any) {
    console.error('Erro ao registrar ciência:', error);
    return res.status(500).json({ error: 'Erro ao registrar ciência.' });
  }
});

// POST /api/v1/notices/:id/dismiss (Arquiva da Home para este usuário)
noticesRouter.post('/:id/dismiss', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    await prisma.noticeAcknowledgment.upsert({
      where: {
        noticeId_userId: {
          noticeId: id,
          userId,
        },
      },
      create: {
        noticeId: id,
        userId,
        userCategory: req.user?.category || 'USUARIO',
        status: 'DISMISSED',
      },
      update: {
        status: 'DISMISSED',
      },
    });

    return res.json({ message: 'Comunicado arquivado da visualização.' });
  } catch (error: any) {
    console.error('Erro ao arquivar comunicado:', error);
    return res.status(500).json({ error: 'Erro ao arquivar.' });
  }
});

// GET /api/v1/notices/:id/audit (Auditoria nominal de ciência)
noticesRouter.get('/:id/audit', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const acknowledgments = await prisma.noticeAcknowledgment.findMany({
      where: { noticeId: id },
      orderBy: { viewedAt: 'desc' },
    });

    return res.json({ acknowledgments });
  } catch (error: any) {
    console.error('Erro na auditoria do comunicado:', error);
    return res.status(500).json({ error: 'Erro ao consultar auditoria.' });
  }
});
