import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { authMiddleware, requireRoles, AuthenticatedRequest } from '../middlewares/auth';

export const rsvpRouter = Router();

// GET /api/v1/rsvp/invite/:token (Público - Carrega dados do convite para responder sem login)
rsvpRouter.get('/invite/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.invitationRSVP.findUnique({
      where: { token },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            locationName: true,
            bannerUrl: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Convite não encontrado ou inválido.' });
    }

    return res.json({ invitation });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao buscar convite.' });
  }
});

// POST /api/v1/rsvp/invite/:token/respond (Público - Confirmar ou Recusar presença)
rsvpRouter.post('/invite/:token/respond', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { status } = req.body; // 'CONFIRMED' | 'DECLINED'

    if (!['CONFIRMED', 'DECLINED'].includes(status)) {
      return res.status(400).json({ error: 'Status de resposta inválido. Use CONFIRMED ou DECLINED.' });
    }

    const invitation = await prisma.invitationRSVP.findUnique({
      where: { token },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Convite não encontrado.' });
    }

    const updated = await prisma.invitationRSVP.update({
      where: { token },
      data: {
        status,
        confirmedAt: status === 'CONFIRMED' ? new Date() : null,
        declinedAt: status === 'DECLINED' ? new Date() : null,
      },
    });

    return res.json({
      message: status === 'CONFIRMED' ? 'Presença confirmada com sucesso! Aguardamos você no IFAM.' : 'Resposta registrada. Agradecemos por informar!',
      invitation: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao processar resposta de RSVP.' });
  }
});

// POST /api/v1/rsvp/events/:eventId/invite-batch (Organizador adiciona lote de convidados)
const batchInviteSchema = z.object({
  guests: z.array(
    z.object({
      name: z.string().min(2),
      email: z.string().email(),
    })
  ),
});

rsvpRouter.post('/events/:eventId/invite-batch', authMiddleware, requireRoles('ORGANIZADOR', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const { guests } = batchInviteSchema.parse(req.body);

    const created = [];
    for (const g of guests) {
      const invite = await prisma.invitationRSVP.upsert({
        where: {
          eventId_guestEmail: {
            eventId,
            guestEmail: g.email,
          },
        },
        create: {
          eventId,
          guestName: g.name,
          guestEmail: g.email,
          status: 'PENDING',
          token: `RSVP-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
        },
        update: {
          guestName: g.name,
        },
      });
      created.push(invite);
    }

    return res.status(201).json({
      message: `${created.length} convite(s) processado(s) com sucesso.`,
      invitations: created,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erro ao importar convidados.' });
  }
});

// POST /api/v1/rsvp/events/:eventId/flowup (Disparo do Flowup para pendentes)
rsvpRouter.post('/events/:eventId/flowup', authMiddleware, requireRoles('ORGANIZADOR', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventId } = req.params;

    const pendingGuests = await prisma.invitationRSVP.findMany({
      where: {
        eventId,
        status: 'PENDING',
      },
    });

    // Atualiza timestamp e incrementa contador de follow-up
    await prisma.invitationRSVP.updateMany({
      where: {
        eventId,
        status: 'PENDING',
      },
      data: {
        lastNotifiedAt: new Date(),
        followupCount: { increment: 1 },
      },
    });

    return res.json({
      message: `Flowup disparado para ${pendingGuests.length} convidado(s) com status Pendente.`,
      notifiedCount: pendingGuests.length,
      guests: pendingGuests.map((g) => ({ name: g.guestName, email: g.guestEmail, token: g.token })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao disparar fluxo de flowup.' });
  }
});
