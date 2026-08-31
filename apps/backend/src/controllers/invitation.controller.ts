import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth';
import crypto from 'crypto';

export class InvitationController {
  // GET /api/v1/invitations/my-invitations (Listar convites pendentes do próprio usuário)
  async getMyInvitations(req: AuthenticatedRequest, res: Response) {
    try {
      const userEmail = req.user!.email;
      const invitations = await prisma.invitationRSVP.findMany({
        where: {
          OR: [
            { userId: req.user!.userId },
            { guestEmail: userEmail }
          ]
        },
        include: {
          event: {
            select: { id: true, title: true, slug: true, startDate: true, locationName: true, bannerUrl: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.json({ invitations });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao buscar convites.' });
    }
  }

  // POST /api/v1/invitations/send (Organizador dispara convites)
  async sendInvitation(req: AuthenticatedRequest, res: Response) {
    try {
      const { eventId, guestEmail, guestName } = req.body;

      if (!eventId || !guestEmail) {
        return res.status(400).json({ error: 'ID do Evento e E-mail do Convidado são obrigatórios.' });
      }

      // Procura se o usuário convidado já existe no banco
      const existingUser = await prisma.user.findUnique({ where: { email: guestEmail.trim() } });
      const token = crypto.randomBytes(24).toString('hex');

      const invitation = await prisma.invitationRSVP.upsert({
        where: {
          eventId_guestEmail: {
            eventId,
            guestEmail: guestEmail.trim(),
          }
        },
        update: {
          guestName: guestName || existingUser?.name || 'Convidado IFAM',
          userId: existingUser?.id || null,
        },
        create: {
          eventId,
          guestEmail: guestEmail.trim(),
          guestName: guestName || existingUser?.name || 'Convidado IFAM',
          userId: existingUser?.id || null,
          token,
          status: 'PENDING',
        },
        include: {
          event: true
        }
      });

      return res.status(201).json({
        message: `Convite enviado com sucesso para ${guestEmail}!`,
        invitation
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Erro ao enviar convite.' });
    }
  }

  // PATCH /api/v1/invitations/:id/rsvp (Convidado responde RSVP: CONFIRMED ou DECLINED)
  async respondRSVP(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body; // CONFIRMED ou DECLINED

      if (status !== 'CONFIRMED' && status !== 'DECLINED') {
        return res.status(400).json({ error: 'Status de RSVP inválido. Use CONFIRMED ou DECLINED.' });
      }

      const updated = await prisma.invitationRSVP.update({
        where: { id },
        data: {
          status,
          ...(status === 'CONFIRMED' ? { confirmedAt: new Date() } : { declinedAt: new Date() })
        },
        include: { event: true }
      });

      // Se confirmado, auto-inscreve no evento geral se não estiver inscrito
      if (status === 'CONFIRMED' && req.user?.userId) {
        await prisma.registration.upsert({
          where: {
            eventId_userId: {
              eventId: updated.eventId,
              userId: req.user.userId,
            }
          },
          update: {},
          create: {
            eventId: updated.eventId,
            userId: req.user.userId,
            code: `RSVP-${Date.now()}`,
          }
        });
      }

      return res.json({
        message: status === 'CONFIRMED'
          ? `Presença confirmada no evento "${updated.event.title}"!`
          : `Convite recusado com sucesso.`,
        invitation: updated
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Erro ao registrar resposta de RSVP.' });
    }
  }
}

export const invitationController = new InvitationController();
