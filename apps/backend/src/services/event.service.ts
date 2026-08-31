import { prisma } from '../prisma/client';
import { eventRepository } from '../repositories/event.repository';

export interface CreateEventDTO {
  title: string;
  slug: string;
  description: string;
  locationName?: string;
  locationAddress?: string;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
  startDate: string;
  endDate: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  themeMode?: 'light' | 'dark' | 'auto';
  certificateType?: 'EVENT_GLOBAL' | 'PER_SESSION' | 'BOTH';
  minAttendanceRate?: number;
  customCssConfig?: string;
  sessions?: any[];
  documents?: any[];
}

export class EventService {
  async listEvents(status?: string, search?: string) {
    const now = new Date();
    const where: any = {
      isPublished: true,
      visibility: 'PUBLIC',
    };

    if (status === 'upcoming') {
      where.endDate = { gte: now };
    } else if (status === 'past') {
      where.endDate = { lt: now };
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    return prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
        sponsors: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            registrations: true,
            sessions: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async listPendingEvents() {
    return prisma.event.findMany({
      where: {
        isPublished: false,
      },
      include: {
        organizer: {
          select: { id: true, name: true, email: true, campus: true },
        },
        sessions: true,
        _count: {
          select: { sessions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveEvent(eventId: string) {
    const existing = await prisma.event.findUnique({
      where: { id: eventId },
      include: { sessions: true },
    });
    if (!existing) {
      throw new Error('Evento não encontrado para aprovação.');
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: { isPublished: true },
    });

    // Notifica palestrantes convidados via e-mail SOMENTE APÓS A PUBLICAÇÃO OFICIAL DO EVENTO
    for (const s of existing.sessions) {
      if (s.speakerName) {
        const speakers = s.speakerName.split(',').map(name => name.trim()).filter(Boolean);
        for (const speaker of speakers) {
          console.log(`📧 [E-MAIL DE NOTIFICAÇÃO DISPARADO] Enviado para o palestrante convidado "${speaker}": O evento "${event.title}" foi APROVADO E PUBLICADO OFICIALMENTE pelo IFAM! Sua atividade "${s.title}" ocorrerá em ${s.startTime.toISOString()}.`);
        }
      }
    }

    return event;
  }

  async getEventBySlugOrId(slugOrId: string) {
    const event = await prisma.event.findFirst({
      where: {
        OR: [{ id: slugOrId }, { slug: slugOrId }],
      },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
        sponsors: {
          orderBy: { order: 'asc' },
        },
        sessions: {
          orderBy: { startTime: 'asc' },
          include: {
            _count: { select: { checkIns: true } },
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      throw new Error('Evento não encontrado.');
    }

    const now = new Date();
    const registrationsCount = event._count.registrations;
    const remainingSeats = event.capacity !== null && event.capacity !== undefined 
      ? Math.max(0, event.capacity - registrationsCount) 
      : null;

    const formattedSessions = event.sessions.map((session: any) => {
      const isCurrentlyLive = session.youtubeLiveUrl && (
        session.isLiveActive || (now >= new Date(session.startTime) && now <= new Date(session.endTime))
      );

      const sessionCheckIns = session._count?.checkIns || 0;
      const sessionRemaining = session.capacity !== null && session.capacity !== undefined
        ? Math.max(0, session.capacity - sessionCheckIns)
        : null;

      return {
        ...session,
        isLiveActive: isCurrentlyLive,
        checkInsCount: sessionCheckIns,
        remainingSeats: sessionRemaining,
      };
    });

    return {
      ...event,
      remainingSeats,
      sessions: formattedSessions,
    };
  }

  async createEvent(data: CreateEventDTO & { capacity?: number }, organizerId: string, isSuperAdmin = false) {
    const existingSlug = await prisma.event.findUnique({ where: { slug: data.slug } });
    if (existingSlug) {
      throw new Error('Já existe um evento com esse slug / identificador.');
    }

    const { sessions, documents, ...eventData } = data;

    const visibilityValue = eventData.visibility === 'RESTRICTED' ? 'PRIVATE' : (eventData.visibility || 'PUBLIC');

    return prisma.event.create({
      data: {
        title: eventData.title,
        slug: eventData.slug,
        description: eventData.description,
        locationName: eventData.locationName,
        locationAddress: eventData.locationAddress,
        visibility: visibilityValue as any,
        category: (eventData as any).category || 'TECNOLOGIA',
        capacity: data.capacity ? Number(data.capacity) : null,
        certificateType: eventData.certificateType || 'EVENT_GLOBAL',
        attendanceTrackingMode: (eventData as any).attendanceTrackingMode || 'PER_SESSION',
        dailyWorkloadHours: (eventData as any).dailyWorkloadHours ? Number((eventData as any).dailyWorkloadHours) : 4.0,
        requireDailyCheckOut: (eventData as any).requireDailyCheckOut !== undefined ? Boolean((eventData as any).requireDailyCheckOut) : true,
        minAttendanceRate: eventData.minAttendanceRate ? Number(eventData.minAttendanceRate) : 0.75,
        isPublished: isSuperAdmin ? true : false,
        startDate: new Date(eventData.startDate),
        endDate: new Date(eventData.endDate),
        bannerUrl: eventData.bannerUrl,
        thumbnailUrl: eventData.thumbnailUrl,
        primaryColor: eventData.primaryColor || '#1B5E20',
        secondaryColor: eventData.secondaryColor || '#C62828',
        themeMode: eventData.themeMode || 'light',
        customCssConfig: eventData.customCssConfig,
        organizerId,
        sessions: sessions && sessions.length > 0 ? {
          create: sessions.map((s) => ({
            title: s.title,
            description: s.description || '',
            speakerName: s.speakerName || '',
            speakerBio: s.speakerBio || '',
            capacity: s.capacity ? Number(s.capacity) : null,
            startTime: new Date(s.startTime),
            endTime: new Date(s.endTime),
            room: s.roomLocation || s.room || 'Auditório Principal',
            workloadHours: Number(s.workloadHours) || 2,
            requireDoubleCheckIn: Boolean(s.requireDoubleCheckIn),
            youtubeLiveUrl: s.youtubeUrl || s.youtubeLiveUrl || null,
            isLiveActive: Boolean(s.isLiveActive),
          })),
        } : undefined,
      },
    });
  }

  async updateEvent(eventId: string, data: any) {
    const existing = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        sessions: {
          include: {
            _count: { select: { checkIns: true } },
          },
        },
      },
    });

    if (!existing) {
      throw new Error('Evento não encontrado para edição.');
    }

    const { sessions, documents, ...eventData } = data;

    // Atualização diferencial de sessões (sem apagar histórico de presenças)
    if (sessions && Array.isArray(sessions)) {
      const incomingIds = sessions.filter((s: any) => Boolean(s.id)).map((s: any) => s.id);

      // Verifica sessões que seriam excluídas
      for (const dbSession of existing.sessions) {
        if (!incomingIds.includes(dbSession.id)) {
          if (dbSession._count.checkIns > 0) {
            throw new Error(
              `Não é permitido remover a palestra/oficina "${dbSession.title}" pois ela já possui ${dbSession._count.checkIns} presença(s) registrada(s).`
            );
          } else {
            await prisma.session.delete({ where: { id: dbSession.id } });
          }
        }
      }

      // Upsert das sessões informadas
      for (const s of sessions) {
        const sessionPayload = {
          title: s.title,
          description: s.description || '',
          speakerName: s.speakerName || '',
          speakerBio: s.speakerBio || '',
          capacity: s.capacity ? Number(s.capacity) : null,
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime),
          room: s.roomLocation || s.room || 'Auditório Principal',
          workloadHours: Number(s.workloadHours) || 2,
          requireDoubleCheckIn: Boolean(s.requireDoubleCheckIn),
          youtubeLiveUrl: s.youtubeUrl || s.youtubeLiveUrl || null,
          isLiveActive: Boolean(s.isLiveActive),
        };

        if (s.id && existing.sessions.some((db) => db.id === s.id)) {
          await prisma.session.update({
            where: { id: s.id },
            data: sessionPayload,
          });
        } else {
          await prisma.session.create({
            data: {
              ...sessionPayload,
              eventId,
            },
          });
        }
      }
    }

    return prisma.event.update({
      where: { id: eventId },
      data: {
        ...(eventData.title && { title: eventData.title }),
        ...(eventData.slug && { slug: eventData.slug }),
        ...(eventData.description && { description: eventData.description }),
        ...(eventData.locationName && { locationName: eventData.locationName }),
        ...(eventData.visibility && { visibility: eventData.visibility }),
        ...(eventData.capacity !== undefined && { capacity: eventData.capacity ? Number(eventData.capacity) : null }),
        ...(eventData.certificateType && { certificateType: eventData.certificateType }),
        ...(eventData.minAttendanceRate !== undefined && { minAttendanceRate: Number(eventData.minAttendanceRate) }),
        ...(eventData.startDate && { startDate: new Date(eventData.startDate) }),
        ...(eventData.endDate && { endDate: new Date(eventData.endDate) }),
        ...(eventData.bannerUrl && { bannerUrl: eventData.bannerUrl }),
      },
      include: {
        sessions: true,
      },
    });
  }

  async registerUserForEvent(eventId: string, userId: string) {
    // 1. Verifica se já está inscrito
    const existing = await prisma.registration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existing) {
      return existing; // Retorna inscrição existente
    }

    // 2. Verifica capacidade do evento (se aplicável)
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    if (!event) {
      throw new Error('Evento não encontrado.');
    }

    if (event.capacity !== null && event.capacity !== undefined) {
      if (event._count.registrations >= event.capacity) {
        throw new Error('Inscrições encerradas: Vagas esgotadas para este evento!');
      }
    }

    // 3. Cria inscrição com código de QR Code único
    const registration = await prisma.registration.create({
      data: {
        eventId,
        userId,
        code: `REG-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            startDate: true,
            endDate: true,
            locationName: true,
            bannerUrl: true,
            primaryColor: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            category: true,
            matriculaOrSiape: true,
            campus: true,
          },
        },
      },
    });

    return registration;
  }

  async getUserRegistration(eventId: string, userId: string) {
    const registration = await prisma.registration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            startDate: true,
            endDate: true,
            locationName: true,
            locationAddress: true,
            bannerUrl: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            category: true,
            matriculaOrSiape: true,
            campus: true,
            cpf: true,
          },
        },
      },
    });

    return registration;
  }

  async confirmAttendance(eventId: string, userId: string) {
    const registration = await prisma.registration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (!registration) {
      throw new Error('Inscrição não encontrada para este evento.');
    }

    return prisma.registration.update({
      where: { id: registration.id },
      data: { attendanceConfirmed: true },
    });
  }

  async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async markNotificationAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }
}

export const eventService = new EventService();
