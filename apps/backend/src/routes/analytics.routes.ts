import { Router, Response } from 'express';
import { prisma } from '../prisma/client';
import { authMiddleware, requireEventOrganizerOrAdmin, AuthenticatedRequest } from '../middlewares/auth';

export const analyticsRouter = Router();

// GET /api/v1/analytics/events/:eventId (Métricas completas do dashboard do organizador)
analyticsRouter.get('/events/:eventId', authMiddleware, requireEventOrganizerOrAdmin('event'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        sessions: {
          include: {
            _count: { select: { checkIns: true } },
          },
          orderBy: { startTime: 'asc' },
        },
        registrations: {
          include: {
            user: {
              select: { category: true },
            },
          },
        },
        invitations: true,
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento não encontrado.' });
    }

    // 1. Total de inscritos e divisão por perfil institucional
    const totalRegistered = event.registrations.length;
    const categoryBreakdown: Record<string, number> = {
      ALUNO: 0,
      PROFESSOR: 0,
      TECNICO: 0,
      EXTERNO: 0,
    };

    for (const reg of event.registrations) {
      const cat = reg.user?.category || 'EXTERNO';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    }

    // 2. Métricas de RSVP
    const totalInvited = event.invitations.length;
    const confirmed = event.invitations.filter((i) => i.status === 'CONFIRMED').length;
    const declined = event.invitations.filter((i) => i.status === 'DECLINED').length;
    const pending = event.invitations.filter((i) => i.status === 'PENDING').length;

    // 3. Taxa de presença por palestra / sessão individual
    const sessionCheckIns = event.sessions.map((s) => {
      const count = s._count.checkIns;
      const rate = totalRegistered > 0 ? Number((count / totalRegistered).toFixed(2)) : 0;
      return {
        sessionId: s.id,
        title: s.title,
        speakerName: s.speakerName,
        checkInsCount: count,
        attendanceRate: rate,
        workloadHours: s.workloadHours,
      };
    });

    // 4. Timeline simulada de fluxo de credenciamento
    const timelineAttendance = event.sessions.map((s, idx) => ({
      timeSlot: new Date(s.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      count: s._count.checkIns,
      sessionTitle: s.title,
    }));

    return res.json({
      eventId: event.id,
      eventTitle: event.title,
      totalRegistered,
      categoryBreakdown,
      rsvpMetrics: {
        totalInvited,
        confirmed,
        declined,
        pending,
      },
      sessionCheckIns,
      timelineAttendance,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao gerar métricas do evento.' });
  }
});

// GET /api/v1/analytics/events/:eventId/export-attendance (Exportar planilha CSV completa de presenças)
analyticsRouter.get('/events/:eventId/export-attendance', authMiddleware, requireEventOrganizerOrAdmin('event'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        sessions: {
          include: {
            checkIns: {
              include: { user: true },
            },
          },
          orderBy: { startTime: 'asc' },
        },
        registrations: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        certificates: {
          include: { user: true },
        },
        dailyAttendances: {
          include: { user: true },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento não encontrado.' });
    }

    // Monta o arquivo CSV com BOM UTF-8 (\uFEFF) para garantir acentuação correta no MS Excel
    const rows: string[] = [];
    
    // Cabeçalho institucional do relatório
    rows.push(`"RELATÓRIO OFICIAL DE FREQUÊNCIA E CERTIFICAÇÃO - IFAM EVENTOS"`);
    rows.push(`"Evento:","${event.title.replace(/"/g, '""')}"`);
    rows.push(`"Data de Realização:","${new Date(event.startDate).toLocaleDateString('pt-BR')} a ${new Date(event.endDate).toLocaleDateString('pt-BR')}"`);
    rows.push(`"Critério Mínimo de Presença:","${Math.round(event.minAttendanceRate * 100)}%"`);
    rows.push(`"Total de Inscritos:","${event.registrations.length}"`);
    rows.push(`"Data da Exportação:","${new Date().toLocaleString('pt-BR')}"`);
    rows.push('');

    // Colunas da Planilha
    rows.push([
      '"Código Inscrição"',
      '"Nome Completo"',
      '"E-mail"',
      '"CPF"',
      '"Matrícula / SIAPE"',
      '"Categoria / Vínculo"',
      '"Campus"',
      '"Data Inscrição"',
      '"Total Sessões Presente"',
      '"Horas Aferidas"',
      '"% Frequência"',
      '"Certificado Emitido?"',
      '"Código de Autenticação"',
      '"Data Emissão"',
    ].join(';'));

    const totalSessions = event.sessions.length;

    // Linha de cada participante
    for (const reg of event.registrations) {
      const u = reg.user;
      const userCert = event.certificates.find((c: any) => c.userId === reg.userId);
      const userCheckIns = event.sessions.filter((s: any) => s.checkIns.some((c: any) => c.userId === reg.userId));
      
      const attendedSessionsCount = userCheckIns.length;
      const calculatedHours = userCheckIns.reduce((acc: number, s: any) => acc + s.workloadHours, 0);
      const attendanceRate = totalSessions > 0 ? (attendedSessionsCount / totalSessions) * 100 : 100;

      rows.push([
        `"${reg.code}"`,
        `"${u?.name?.replace(/"/g, '""') || ''}"`,
        `"${u?.email || ''}"`,
        `"${u?.cpf || 'Não informado'}"`,
        `"${u?.matriculaOrSiape || 'Não informado'}"`,
        `"${u?.category || 'EXTERNO'}"`,
        `"${u?.campus || 'IFAM'}"`,
        `"${new Date(reg.createdAt).toLocaleString('pt-BR')}"`,
        `"${attendedSessionsCount} / ${totalSessions}"`,
        `"${calculatedHours.toFixed(1)}h"`,
        `"${attendanceRate.toFixed(1)}%"`,
        `"${userCert ? 'SIM' : 'NÃO'}"`,
        `"${userCert?.validationCode || '-'}"`,
        `"${userCert ? new Date(userCert.issuedAt).toLocaleString('pt-BR') : '-'}"`,
      ].join(';'));
    }

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const sanitizedSlug = event.slug.replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="frequencia_${sanitizedSlug}_${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao gerar relatório CSV de frequências: ' + err.message });
  }
});

