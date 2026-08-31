import { prisma } from '../prisma/client';
import { Event, Prisma } from '@prisma/client';

export class EventRepository {
  async findAll(options?: { campus?: string; modality?: string }): Promise<Event[]> {
    const where: Prisma.EventWhereInput = {};

    return prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        organizer: {
          select: { id: true, name: true, email: true, campus: true, avatarUrl: true },
        },
        _count: {
          select: { registrations: true, sessions: true },
        },
      },
    });
  }

  async findBySlug(slug: string): Promise<Event | null> {
    return prisma.event.findUnique({
      where: { slug },
      include: {
        organizer: {
          select: { id: true, name: true, email: true, campus: true, bio: true, avatarUrl: true },
        },
        sessions: {
          orderBy: { startTime: 'asc' },
        },
        sponsors: true,
        _count: {
          select: { registrations: true },
        },
      },
    });
  }

  async findById(id: string): Promise<Event | null> {
    return prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        sessions: true,
      },
    });
  }

  async create(data: Prisma.EventCreateInput): Promise<Event> {
    return prisma.event.create({
      data,
    });
  }
}

export const eventRepository = new EventRepository();
