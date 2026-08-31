import { Request, Response } from 'express';
import { z } from 'zod';
import { eventService } from '../services/event.service';
import { AuthenticatedRequest } from '../middlewares/auth';

const eventSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  description: z.string(),
  locationName: z.string().optional(),
  locationAddress: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'RESTRICTED']).default('PUBLIC'),
  category: z.string().default('TECNOLOGIA'),
  certificateType: z.enum(['EVENT_GLOBAL', 'PER_SESSION', 'BOTH']).default('EVENT_GLOBAL'),
  attendanceTrackingMode: z.enum(['PER_SESSION', 'DAILY_ATTENDANCE', 'GLOBAL_SINGLE_CHECKIN']).default('PER_SESSION'),
  dailyWorkloadHours: z.number().optional().default(4.0),
  requireDailyCheckOut: z.boolean().optional().default(true),
  minAttendanceRate: z.number().min(0.1).max(1.0).default(0.75),
  capacity: z.number().optional(),
  startDate: z.string(),
  endDate: z.string(),
  bannerUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  primaryColor: z.string().default('#1B5E20'),
  secondaryColor: z.string().default('#C62828'),
  themeMode: z.enum(['light', 'dark', 'auto']).default('light'),
  customCssConfig: z.string().optional(),
  sessions: z.array(z.any()).optional(),
  documents: z.array(z.any()).optional(),
});

export class EventController {
  async list(req: Request, res: Response) {
    try {
      const { status, search } = req.query;
      const events = await eventService.listEvents(
        status as string | undefined,
        search as string | undefined
      );
      return res.json({ events });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao buscar eventos.' });
    }
  }

  async listPending(req: AuthenticatedRequest, res: Response) {
    try {
      const events = await eventService.listPendingEvents();
      return res.json({ events });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao buscar eventos pendentes.' });
    }
  }

  async approve(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const event = await eventService.approveEvent(id);
      return res.json({
        message: 'Evento aprovado e publicado com sucesso no catálogo público!',
        event,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Erro ao aprovar evento.' });
    }
  }

  async getBySlugOrId(req: Request, res: Response) {
    try {
      const { slugOrId } = req.params;
      const event = await eventService.getEventBySlugOrId(slugOrId);
      return res.json({ event });
    } catch (err: any) {
      return res.status(404).json({ error: err.message || 'Evento não encontrado.' });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.body.title) {
        const rawSlug = req.body.slug || req.body.title;
        let cleanSlug = rawSlug
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

        if (cleanSlug.length < 3) {
          cleanSlug = `${cleanSlug || 'evento'}-${Date.now().toString(36)}`;
        }
        req.body.slug = cleanSlug;
      }

      const data = eventSchema.parse(req.body);
      const isSuperAdmin = req.user!.role === 'SUPER_ADMIN' || req.user!.role === 'ADMIN_MASTER' || req.user!.role === 'ADMIN_UNIDADE';
      const event = await eventService.createEvent(data, req.user!.userId, isSuperAdmin);
      return res.status(201).json({
        message: isSuperAdmin
          ? 'Evento criado e publicado com sucesso!'
          : 'Evento cadastrado com sucesso! Status: Pendente de Aprovação pelo Admin.',
        event,
      });
    } catch (err: any) {
      let errorMsg = err.message || 'Erro ao criar evento.';
      if (err instanceof z.ZodError) {
        errorMsg = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      }
      return res.status(400).json({ error: errorMsg });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const event = await eventService.updateEvent(id, req.body);
      return res.json({
        message: 'Evento e programação de palestras atualizados com sucesso!',
        event,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Erro ao atualizar evento.' });
    }
  }

  async registerUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const registration = await eventService.registerUserForEvent(id, req.user!.userId);
      return res.status(201).json({
        message: 'Inscrição confirmada com sucesso!',
        registration,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Erro ao processar inscrição no evento.' });
    }
  }

  async getMyRegistration(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const registration = await eventService.getUserRegistration(id, req.user!.userId);
      return res.json({ registration });
    } catch (err: any) {
      return res.status(404).json({ error: err.message || 'Inscrição não encontrada.' });
    }
  }

  async confirmAttendance(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const registration = await eventService.confirmAttendance(id, req.user!.userId);
      return res.json({
        message: 'Sua presença foi confirmada com sucesso! Aguardamos você no evento.',
        registration,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Erro ao confirmar presença.' });
    }
  }

  async listNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const notifications = await eventService.getUserNotifications(req.user!.userId);
      return res.json({ notifications });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao listar notificações.' });
    }
  }

  async markNotificationRead(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await eventService.markNotificationAsRead(id, req.user!.userId);
      return res.json({ message: 'Notificação marcada como lida.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Erro ao atualizar notificação.' });
    }
  }
}

export const eventController = new EventController();
