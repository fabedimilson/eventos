import { Router } from 'express';
import { prisma } from '../prisma/client';
import { eventController } from '../controllers/event.controller';
import { postController } from '../controllers/post.controller';
import { authMiddleware, requireCanCreateEvent, requireEventOrganizerOrAdmin } from '../middlewares/auth';

export const eventsRouter = Router();

// GET /api/v1/events (Público - Catálogo de eventos publicados)
eventsRouter.get('/', (req, res) => eventController.list(req, res));

// GET /api/v1/events/admin/pending (Protegido - Eventos pendentes de aprovação)
eventsRouter.get('/admin/pending', authMiddleware, (req, res) => eventController.listPending(req, res));

// PATCH /api/v1/events/:id/approve (Protegido - Admin aprova evento)
eventsRouter.patch('/:id/approve', authMiddleware, (req, res) => eventController.approve(req, res));

// GET /api/v1/events/user/notifications (Notificações do Usuário)
eventsRouter.get('/user/notifications', authMiddleware, (req, res) => eventController.listNotifications(req, res));

// PATCH /api/v1/events/user/notifications/:id/read (Marcar notificação como lida)
eventsRouter.patch('/user/notifications/:id/read', authMiddleware, (req, res) => eventController.markNotificationRead(req, res));

// GET /api/v1/events/:id/my-registration (Buscar bilhete/inscrição do usuário no evento)
eventsRouter.get('/:id/my-registration', authMiddleware, (req, res) => eventController.getMyRegistration(req, res));

// POST /api/v1/events/:id/confirm-attendance (Confirmar presença no evento via follow-up 24h)
eventsRouter.post('/:id/confirm-attendance', authMiddleware, (req, res) => eventController.confirmAttendance(req, res));

// GET /api/v1/events/:slugOrId (Detalhes do evento)
eventsRouter.get('/:slugOrId', (req, res) => eventController.getBySlugOrId(req, res));

// POST /api/v1/events (Criar Evento - Servidores / Admin)
eventsRouter.post('/', authMiddleware, requireCanCreateEvent, (req, res) => eventController.create(req, res));

// PUT /api/v1/events/:id (Editar Evento e Programação de Palestras)
eventsRouter.put('/:id', authMiddleware, requireEventOrganizerOrAdmin('event'), (req, res) => eventController.update(req, res));

// POST /api/v1/events/:id/register (Inscrever usuário no evento)
eventsRouter.post('/:id/register', authMiddleware, (req, res) => eventController.registerUser(req, res));

// GET /api/v1/events/:id/posts (Listar feed social do evento)
eventsRouter.get('/:id/posts', (req, res) => postController.listByEvent(req, res));

// POST /api/v1/events/:id/posts (Publicar foto/texto no feed do evento)
eventsRouter.post('/:id/posts', authMiddleware, (req, res) => postController.create(req, res));

// POST /api/v1/events/posts/:postId/report (Denunciar publicação no feed)
eventsRouter.post('/posts/:postId/report', authMiddleware, (req, res) => postController.report(req, res));

// GET /api/v1/events/admin/reports (Listar denúncias do feed para moderação)
eventsRouter.get('/admin/reports', authMiddleware, (req, res) => postController.listReports(req, res));

// PATCH /api/v1/events/admin/reports/:reportId/resolve (Resolver denúncia)
eventsRouter.patch('/admin/reports/:reportId/resolve', authMiddleware, (req, res) => postController.resolveReport(req, res));

// DELETE /api/v1/events/posts/:postId (Remover/Arquivar publicação - Moderadores / Autor)
eventsRouter.delete('/posts/:postId', authMiddleware, (req, res) => postController.delete(req, res));

// ---------------------------------------------------------------------------------
// AFERIÇÃO DIÁRIA DE FREQUÊNCIA (CHECK-IN / CHECK-OUT POR DIA DO EVENTO)
// ---------------------------------------------------------------------------------

// GET /api/v1/events/:id/daily-attendance (Histórico diário de presenças do participante)
eventsRouter.get('/:id/daily-attendance', authMiddleware, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        dailyAttendances: {
          where: { userId: currentUserId },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento não encontrado.' });
    }

    // Calcula os dias corridos do evento
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const eventDays: string[] = [];

    const curr = new Date(start);
    while (curr <= end) {
      eventDays.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }

    const completedDays = event.dailyAttendances.filter(
      (a) => a.status === 'COMPLETED' || a.checkOutAt || !event.requireDailyCheckOut
    ).length;

    const totalDays = eventDays.length || 1;
    const attendanceRate = completedDays / totalDays;
    const isEligibleForCertificate = attendanceRate >= event.minAttendanceRate;

    return res.json({
      attendanceTrackingMode: event.attendanceTrackingMode,
      dailyWorkloadHours: event.dailyWorkloadHours || 4.0,
      requireDailyCheckOut: event.requireDailyCheckOut,
      minAttendanceRate: event.minAttendanceRate,
      eventDays,
      userAttendances: event.dailyAttendances,
      completedDays,
      totalDays,
      attendanceRate: Number(attendanceRate.toFixed(2)),
      isEligibleForCertificate,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao buscar frequência diária.' });
  }
});

// POST /api/v1/events/:id/daily-attendance/checkin (Check-in ou Check-out diário do participante)
eventsRouter.post('/:id/daily-attendance/checkin', authMiddleware, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;
    const { targetDate, forceCheckOut } = req.body;

    const todayStr = targetDate || new Date().toISOString().split('T')[0];

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: 'Evento não encontrado.' });
    }

    // Verifica se já existe registro para hoje
    const existing = await prisma.dailyAttendance.findUnique({
      where: {
        eventId_userId_date: {
          eventId: id,
          userId: currentUserId,
          date: todayStr,
        },
      },
    });

    if (!existing) {
      // 1º Ponto do Dia: Check-in de Entrada
      const newAttendance = await prisma.dailyAttendance.create({
        data: {
          eventId: id,
          userId: currentUserId,
          date: todayStr,
          checkInAt: new Date(),
          status: event.requireDailyCheckOut ? 'IN_PROGRESS' : 'COMPLETED',
          method: 'QR_CODE_SCAN',
        },
      });

      return res.json({
        type: 'CHECK_IN',
        message: `✅ Check-in de Entrada realizado com sucesso para o dia ${todayStr}!`,
        attendance: newAttendance,
      });
    }

    // Se já fez check-in e exige check-out:
    if (event.requireDailyCheckOut && (!existing.checkOutAt || forceCheckOut)) {
      const now = new Date();
      const diffMs = now.getTime() - new Date(existing.checkInAt).getTime();
      const durationMinutes = Math.round(diffMs / 60000);

      const updated = await prisma.dailyAttendance.update({
        where: { id: existing.id },
        data: {
          checkOutAt: now,
          durationMinutes: durationMinutes,
          status: 'COMPLETED',
        },
      });

      return res.json({
        type: 'CHECK_OUT',
        message: `🏁 Check-out de Saída realizado com sucesso! Permanência no dia: ${durationMinutes} minutos.`,
        attendance: updated,
      });
    }

    return res.json({
      type: 'ALREADY_COMPLETED',
      message: `Você já completou a frequência para o dia ${todayStr}.`,
      attendance: existing,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao registrar frequência diária.' });
  }
});


