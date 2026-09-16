import { Router, Response } from 'express';
import { prisma } from '../prisma/client';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest, requireRoles } from '../middlewares/auth';

export const noticesRouter = Router();

// GET /api/v1/notices/active (Retorna o comunicado ativo para o campus do usuário ou visitante)
noticesRouter.get('/active', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user
      ? await prisma.user.findUnique({ where: { id: req.user.userId } })
      : null;
    const userCampus = (req.query.campus as string) || user?.campus || 'Campus Manaus Centro';
    const userId = req.user?.userId;

    const notice = await prisma.notice.findFirst({
      where: {
        campus: {
          in: [userCampus, 'Todos os Campi do IFAM'],
        },
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

// GET /api/v1/notices (Listagem completa para o Painel de Gestão - Apenas Moderadores/Admins)
noticesRouter.get('/', authMiddleware, requireRoles('ADMIN_UNIDADE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user!.role;
    const userCampus = req.user!.campus;
    const { campus, status } = req.query;

    const where: any = {};

    // ADMIN_UNIDADE (não master) restringe aos avisos do seu campus ou gerais
    if (userRole === 'ADMIN_UNIDADE' && userCampus) {
      where.OR = [
        { campus: userCampus },
        { campus: 'Todos os Campi do IFAM' },
      ];
    } else if (campus && campus !== 'ALL') {
      where.campus = String(campus);
    }

    if (status && status !== 'ALL') {
      where.status = String(status);
    }

    const notices = await prisma.notice.findMany({
      where,
      include: {
        acknowledgments: {
          select: { status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = notices.map((n) => {
      const totalAcks = n.acknowledgments.filter((a) => a.status === 'ACKNOWLEDGED').length;
      const totalViews = n.acknowledgments.length;
      return {
        ...n,
        stats: {
          totalAcks,
          totalViews,
        },
      };
    });

    return res.json({ notices: formatted });
  } catch (error: any) {
    console.error('Erro ao listar comunicados no painel:', error);
    return res.status(500).json({ error: 'Erro ao listar comunicados.' });
  }
});

// POST /api/v1/notices (Cria novo comunicado oficial - Apenas Moderadores/Admins de Unidade ou Master)
noticesRouter.post('/', authMiddleware, requireRoles('ADMIN_UNIDADE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, severity, targetAudience, campus, requiresAcknowledgment, expiresAt } = req.body;
    const user = req.user
      ? await prisma.user.findUnique({ where: { id: req.user.userId } })
      : null;
    const userCampus = campus || user?.campus || 'Campus Manaus Centro';

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ error: 'Título e conteúdo são obrigatórios para publicar o comunicado.' });
    }

    const notice = await prisma.notice.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        severity: severity || 'CRITICAL',
        campus: userCampus,
        targetAudience: targetAudience || 'TODOS',
        requiresAcknowledgment: requiresAcknowledgment !== undefined ? Boolean(requiresAcknowledgment) : true,
        publisherName: user?.name || 'Moderador do Campus',
        publisherRole: user?.role === 'ADMIN_MASTER' || user?.role === 'SUPER_ADMIN' ? 'ADMIN_MASTER' : 'ADMIN_UNIDADE',
        status: 'ACTIVE',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return res.status(201).json({ message: 'Comunicado publicado com sucesso!', notice });
  } catch (error: any) {
    console.error('Erro ao criar comunicado:', error);
    return res.status(500).json({ error: 'Erro ao publicar comunicado.' });
  }
});

// PUT /api/v1/notices/:id (Editar comunicado - Apenas Moderadores/Admins)
noticesRouter.put('/:id', authMiddleware, requireRoles('ADMIN_UNIDADE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, severity, targetAudience, campus, requiresAcknowledgment, status, expiresAt } = req.body;

    const existing = await prisma.notice.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Comunicado não encontrado.' });
    }

    const updated = await prisma.notice.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content: content.trim() }),
        ...(severity !== undefined && { severity }),
        ...(campus !== undefined && { campus }),
        ...(targetAudience !== undefined && { targetAudience }),
        ...(requiresAcknowledgment !== undefined && { requiresAcknowledgment: Boolean(requiresAcknowledgment) }),
        ...(status !== undefined && { status }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
    });

    return res.json({ message: 'Comunicado atualizado com sucesso!', notice: updated });
  } catch (error: any) {
    console.error('Erro ao editar comunicado:', error);
    return res.status(500).json({ error: 'Erro ao editar comunicado.' });
  }
});

// PATCH /api/v1/notices/:id/status (Arquivar / Reativar comunicado no feed)
noticesRouter.patch('/:id/status', authMiddleware, requireRoles('ADMIN_UNIDADE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existing = await prisma.notice.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Comunicado não encontrado.' });
    }

    const nextStatus = status || (existing.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE');

    const updated = await prisma.notice.update({
      where: { id },
      data: { status: nextStatus },
    });

    return res.json({
      message: nextStatus === 'ARCHIVED' ? 'Aviso arquivado do feed com sucesso!' : 'Aviso reativado com sucesso!',
      notice: updated,
    });
  } catch (error: any) {
    console.error('Erro ao alterar status do comunicado:', error);
    return res.status(500).json({ error: 'Erro ao alterar status do comunicado.' });
  }
});

// DELETE /api/v1/notices/:id (Excluir comunicado permanentemente)
noticesRouter.delete('/:id', authMiddleware, requireRoles('ADMIN_UNIDADE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.notice.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Comunicado não encontrado.' });
    }

    await prisma.notice.delete({ where: { id } });

    return res.json({ message: 'Comunicado excluído com sucesso!' });
  } catch (error: any) {
    console.error('Erro ao excluir comunicado:', error);
    return res.status(500).json({ error: 'Erro ao excluir comunicado.' });
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
