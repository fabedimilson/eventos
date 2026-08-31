import { Router } from 'express';
import { invitationController } from '../controllers/invitation.controller';
import { authMiddleware } from '../middlewares/auth';

export const invitationsRouter = Router();

// GET /api/v1/invitations/my-invitations (Listar convites do usuário)
invitationsRouter.get('/my-invitations', authMiddleware, (req, res) => invitationController.getMyInvitations(req, res));

// POST /api/v1/invitations/send (Disparar convite individual)
invitationsRouter.post('/send', authMiddleware, (req, res) => invitationController.sendInvitation(req, res));

// PATCH /api/v1/invitations/:id/rsvp (Responder RSVP: CONFIRMED / DECLINED)
invitationsRouter.patch('/:id/rsvp', authMiddleware, (req, res) => invitationController.respondRSVP(req, res));
