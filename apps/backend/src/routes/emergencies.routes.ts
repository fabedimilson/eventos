import { Router, Response } from 'express';
import { prisma } from '../prisma/client';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middlewares/auth';

export const emergenciesRouter = Router();

// GET /api/v1/emergencies/active (Retorna ocorrência ativa do campus/usuário ou visitante)
emergenciesRouter.get('/active', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user
      ? await prisma.user.findUnique({ where: { id: req.user.userId } })
      : null;
    const userCampus = user?.campus || 'Campus Manaus Centro';

    const activeEmergency = await prisma.academicEmergency.findFirst({
      where: {
        campus: userCampus,
        status: { in: ['ACTIVE', 'EN_ROUTE'] },
      },
      include: {
        responders: true,
      },
      orderBy: { triggeredAt: 'desc' },
    });

    if (!activeEmergency) {
      return res.json({ emergency: null });
    }

    // Busca o socorrista a caminho se houver
    const goingResponder = activeEmergency.responders.find((r) => r.responseType === 'GOING');

    return res.json({
      emergency: {
        ...activeEmergency,
        responder: goingResponder ? {
          name: goingResponder.userName,
          role: goingResponder.userRole || 'Servidor Habilitado',
          time: 'A caminho',
        } : null,
        totalNotified: activeEmergency.responders.length || 4,
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar emergência ativa:', error);
    return res.status(500).json({ error: 'Erro ao buscar emergência ativa.' });
  }
});

// GET /api/v1/emergencies (Lista histórico de ocorrências com base em privacidade estrita)
emergenciesRouter.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: currentUserId } });
    const userCampus = user?.campus || 'Campus Manaus Centro';
    const userRole = req.user?.role || 'PARTICIPANTE';

    const isMasterAdmin = ['ADMIN_MASTER', 'SUPER_ADMIN'].includes(userRole);
    const isCampusAdmin = ['ADMIN_UNIDADE', 'ADMIN'].includes(userRole);
    const isAdmin = isMasterAdmin || isCampusAdmin;

    let whereClause: any = {};

    if (isMasterAdmin) {
      // Admin Master tem visão global de todas as unidades
      whereClause = {};
    } else if (isCampusAdmin) {
      // Admin de Unidade gerencia o campus dele
      whereClause = { campus: userCampus };
    } else {
      // Usuário comum/servidor: vê chamados criados por ele, onde ele foi vítima, onde atuou como socorrista ou finalizador
      whereClause = {
        OR: [
          { createdById: currentUserId },
          ...(user?.name ? [{ involvedPersonName: user.name }] : []),
          { resolverId: currentUserId },
          { responders: { some: { userId: currentUserId } } },
        ],
      };
    }

    const occurrences = await prisma.academicEmergency.findMany({
      where: whereClause,
      include: {
        responders: true,
      },
      orderBy: { triggeredAt: 'desc' },
      take: 50,
    });

    return res.json({ occurrences, isAdminView: isAdmin });
  } catch (error: any) {
    console.error('Erro ao listar ocorrências:', error);
    return res.status(500).json({ error: 'Erro ao buscar histórico de ocorrências.' });
  }
});

// GET /api/v1/emergencies/:id/responders (Lista de socorristas reais da ocorrência)
emergenciesRouter.get('/:id/responders', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: currentUserId } });

    const emergency = await prisma.academicEmergency.findUnique({
      where: { id },
      include: {
        responders: {
          orderBy: { respondedAt: 'desc' },
        },
      },
    });

    if (!emergency) {
      return res.status(404).json({ error: 'Emergência não encontrada.' });
    }

    const isRequester = emergency.createdById === currentUserId || emergency.involvedPersonName === user?.name || emergency.targetActor === 'SELF';

    return res.json({
      emergencyId: emergency.id,
      isRequester,
      involvedPersonName: emergency.involvedPersonName,
      status: emergency.status,
      responders: emergency.responders,
    });
  } catch (error: any) {
    console.error('Erro ao buscar socorristas:', error);
    return res.status(500).json({ error: 'Erro ao buscar socorristas.' });
  }
});

// POST /api/v1/emergencies (Dispara novo pedido de socorro no banco)
emergenciesRouter.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, blockLocation, targetActor, involvedPersonName } = req.body;
    const user = req.user
      ? await prisma.user.findUnique({ where: { id: req.user.userId } })
      : null;
    const userCampus = user?.campus || 'Campus Manaus Centro';

    if (!category || !blockLocation) {
      return res.status(400).json({ error: 'Categoria e Bloco/Local são obrigatórios.' });
    }

    const emergency = await prisma.academicEmergency.create({
      data: {
        category,
        campus: userCampus,
        blockLocation,
        targetActor: targetActor || 'SELF',
        involvedPersonName: involvedPersonName || user?.name || 'Vítima',
        createdById: req.user?.userId || null,
        status: 'ACTIVE',
      },
    });

    // Registra o solicitante no log
    if (user) {
      await prisma.emergencyResponderLog.create({
        data: {
          emergencyId: emergency.id,
          userId: user.id,
          userName: user.name,
          userRole: user.category,
          responseType: 'VIEWED',
        },
      });
    }

    return res.status(201).json({
      message: 'Alerta de emergência registrado e transmitido com sucesso!',
      emergency,
    });
  } catch (error: any) {
    console.error('Erro ao criar emergência:', error);
    return res.status(500).json({ error: 'Erro ao registrar emergência no banco.' });
  }
});

// POST /api/v1/emergencies/:id/respond (Socorrista responde ao chamado)
emergenciesRouter.post('/:id/respond', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { responseType } = req.body; // GOING | CANNOT | VIEWED
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });

    if (!['GOING', 'CANNOT', 'VIEWED'].includes(responseType)) {
      return res.status(400).json({ error: 'Tipo de resposta inválido.' });
    }

    const log = await prisma.emergencyResponderLog.create({
      data: {
        emergencyId: id,
        userId: user ? user.id : req.user!.userId,
        userName: user ? user.name : 'Servidor',
        userRole: user ? `${user.category} • ${user.campus || 'IFAM'}` : 'Servidor',
        responseType,
      },
    });

    if (responseType === 'GOING') {
      await prisma.academicEmergency.update({
        where: { id },
        data: { status: 'EN_ROUTE' },
      });
    }

    return res.json({ message: 'Resposta registrada com sucesso!', log });
  } catch (error: any) {
    console.error('Erro ao responder emergência:', error);
    return res.status(500).json({ error: 'Erro ao registrar resposta.' });
  }
});

// POST /api/v1/emergencies/:id/resolve (Finaliza a ocorrência)
emergenciesRouter.post('/:id/resolve', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { resolutionNotes, resolutionCategory } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });

    const updated = await prisma.academicEmergency.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolutionNotes: resolutionNotes || 'Ocorrência atendida e finalizada com sucesso.',
        resolutionCategory: resolutionCategory || 'RESOLVED_ON_SITE',
        resolverId: req.user!.userId,
        resolverName: user ? user.name : 'Servidor Responsável',
      },
    });

    return res.json({ message: 'Ocorrência finalizada com sucesso!', emergency: updated });
  } catch (error: any) {
    console.error('Erro ao finalizar emergência:', error);
    return res.status(500).json({ error: 'Erro ao finalizar ocorrência.' });
  }
});
