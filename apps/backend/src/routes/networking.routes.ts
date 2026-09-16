import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/auth';

export const networkingRouter = Router();

// GET /api/v1/networking/directory (Diretório global de participantes cadastrados no IFAM)
networkingRouter.get('/directory', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, search, campus } = req.query;
    const currentUserId = req.user!.userId;

    const whereUser: any = {
      isInvisibleInNetworking: false, // Oculta quem ativou modo invisível
      id: { not: currentUserId },      // Não lista a si próprio
    };

    if (category && typeof category === 'string' && category !== 'ALL') {
      whereUser.category = category;
    }

    if (campus && typeof campus === 'string' && campus !== 'ALL') {
      whereUser.campus = campus;
    }

    if (search && typeof search === 'string' && search.trim()) {
      whereUser.OR = [
        { name: { contains: search } },
        { bio: { contains: search } },
        { campus: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereUser,
      select: {
        id: true,
        name: true,
        email: true,
        category: true,
        role: true,
        campus: true,
        avatarUrl: true,
        bio: true,
        isInvisibleInNetworking: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
      take: 50,
    });

    return res.json({ attendees: users });
  } catch (err: any) {
    console.error('Erro ao buscar diretório de networking:', err);
    return res.status(500).json({ error: 'Erro ao listar participantes do networking.' });
  }
});

// GET /api/v1/networking/events/:eventId/attendees (Diretório de Participantes de um evento específico)
networkingRouter.get('/events/:eventId/attendees', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const { category, search } = req.query;
    const currentUserId = req.user!.userId;

    const whereUser: any = {
      isInvisibleInNetworking: false, // Oculta quem ativou modo invisível
      id: { not: currentUserId },      // Não lista a si próprio
    };

    if (category && typeof category === 'string' && category !== 'ALL') {
      whereUser.category = category;
    }

    if (search && typeof search === 'string') {
      whereUser.OR = [
        { name: { contains: search } },
        { bio: { contains: search } },
        { campus: { contains: search } },
      ];
    }

    const registrations = await prisma.registration.findMany({
      where: {
        eventId,
        user: whereUser,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            category: true,
            campus: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const attendees = registrations.map((r) => r.user);
    return res.json({ attendees });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao listar participantes do networking.' });
  }
});

// POST /api/v1/networking/chats/direct (Iniciar ou abrir sala de conversa 1-to-1)
const directChatSchema = z.object({
  targetUserId: z.string(),
  eventId: z.string().optional(),
});

networkingRouter.post('/chats/direct', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const { targetUserId, eventId } = directChatSchema.parse(req.body);

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'Não é possível iniciar conversa consigo mesmo.' });
    }

    // Busca se já existe uma sala entre estes dois usuários
    const userRooms = await prisma.chatParticipant.findMany({
      where: { userId: currentUserId },
      select: { chatRoomId: true },
    });

    const roomIds = userRooms.map((r) => r.chatRoomId);

    const commonRoom = await prisma.chatParticipant.findFirst({
      where: {
        chatRoomId: { in: roomIds },
        userId: targetUserId,
      },
      include: {
        chatRoom: {
          include: {
            messages: {
              orderBy: { sentAt: 'asc' },
              take: 50,
            },
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, avatarUrl: true, category: true, campus: true },
                },
              },
            },
          },
        },
      },
    });

    if (commonRoom) {
      return res.json({ chatRoom: commonRoom.chatRoom });
    }

    // Cria nova sala 1-to-1
    const newRoom = await prisma.chatRoom.create({
      data: {
        eventId: eventId || null,
        participants: {
          create: [
            { userId: currentUserId },
            { userId: targetUserId },
          ],
        },
      },
      include: {
        messages: true,
        participants: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true, category: true, campus: true },
            },
          },
        },
      },
    });

    return res.status(201).json({ chatRoom: newRoom });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erro ao iniciar conversa.' });
  }
});

// GET /api/v1/networking/unread-count (Total global de mensagens não lidas do usuário)
networkingRouter.get('/unread-count', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user!.userId;

    const userRooms = await prisma.chatParticipant.findMany({
      where: { userId: currentUserId },
      select: { chatRoomId: true, lastReadAt: true },
    });

    let unreadTotal = 0;
    for (const room of userRooms) {
      const count = await prisma.message.count({
        where: {
          chatRoomId: room.chatRoomId,
          senderId: { not: currentUserId },
          sentAt: { gt: room.lastReadAt },
        },
      });
      unreadTotal += count;
    }

    return res.json({ unreadTotal });
  } catch (err: any) {
    console.error('Erro ao contar mensagens não lidas:', err);
    return res.status(500).json({ error: 'Erro ao contar mensagens não lidas.' });
  }
});

// GET /api/v1/networking/online-users (Lista de IDs de usuários conectados no momento)
networkingRouter.get('/online-users', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const onlineUserIds: Set<string> = req.app.get('onlineUserIds') || new Set();
  return res.json({ onlineUserIds: Array.from(onlineUserIds) });
});

// GET /api/v1/networking/chats/my (Lista de conversas do usuário com contagem não lida)
networkingRouter.get('/chats/my', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user!.userId;

    const participants = await prisma.chatParticipant.findMany({
      where: { userId: currentUserId },
      include: {
        chatRoom: {
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, avatarUrl: true, category: true, campus: true },
                },
              },
            },
            messages: {
              orderBy: { sentAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    const rooms = await Promise.all(
      participants.map(async (p) => {
        const otherParticipant = p.chatRoom.participants.find((cp) => cp.userId !== currentUserId)?.user;
        const unreadCount = await prisma.message.count({
          where: {
            chatRoomId: p.chatRoomId,
            senderId: { not: currentUserId },
            sentAt: { gt: p.lastReadAt },
          },
        });

        return {
          id: p.chatRoom.id,
          eventId: p.chatRoom.eventId,
          otherParticipant,
          lastMessage: p.chatRoom.messages[0] || null,
          unreadCount,
          updatedAt: p.chatRoom.updatedAt,
        };
      })
    );

    rooms.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return res.json({ rooms });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao buscar conversas ativas.' });
  }
});

// PATCH /api/v1/networking/chats/:roomId/read (Marca conversa como lida)
networkingRouter.patch('/chats/:roomId/read', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const currentUserId = req.user!.userId;

    await prisma.chatParticipant.updateMany({
      where: {
        chatRoomId: roomId,
        userId: currentUserId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    await prisma.message.updateMany({
      where: {
        chatRoomId: roomId,
        senderId: { not: currentUserId },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${currentUserId}`).emit('messages_read', { roomId });
      const roomParticipants = await prisma.chatParticipant.findMany({
        where: { chatRoomId: roomId },
        select: { userId: true },
      });
      for (const p of roomParticipants) {
        if (p.userId !== currentUserId) {
          io.to(`user:${p.userId}`).emit('messages_read', { roomId, readBy: currentUserId });
        }
      }
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error('Erro ao marcar mensagens como lidas:', err);
    return res.status(500).json({ error: 'Erro ao marcar como lida.' });
  }
});

// GET /api/v1/networking/chats/:roomId/messages (Histórico de mensagens de uma sala)
networkingRouter.get('/chats/:roomId/messages', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const currentUserId = req.user!.userId;

    const isMember = await prisma.chatParticipant.findUnique({
      where: {
        chatRoomId_userId: {
          chatRoomId: roomId,
          userId: currentUserId,
        },
      },
    });

    if (!isMember) {
      return res.status(403).json({ error: 'Acesso negado a esta sala de chat.' });
    }

    const messages = await prisma.message.findMany({
      where: { chatRoomId: roomId },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true, category: true },
        },
      },
      orderBy: { sentAt: 'asc' },
    });

    return res.json({ messages });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao carregar mensagens.' });
  }
});

// POST /api/v1/networking/chats/:roomId/messages (Enviar mensagem via REST)
networkingRouter.post('/chats/:roomId/messages', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const currentUserId = req.user!.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Conteúdo da mensagem não pode ser vazio.' });
    }

    const message = await prisma.message.create({
      data: {
        chatRoomId: roomId,
        senderId: currentUserId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true, category: true },
        },
      },
    });

    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`room:${roomId}`).emit('new_message', message);
      const roomParticipants = await prisma.chatParticipant.findMany({
        where: { chatRoomId: roomId },
        select: { userId: true },
      });
      for (const p of roomParticipants) {
        if (p.userId !== currentUserId) {
          io.to(`user:${p.userId}`).emit('chat_notification', {
            chatRoomId: roomId,
            message,
          });
        }
      }
    }

    return res.status(201).json({ message });
  } catch (err: any) {
    console.error('Erro ao enviar mensagem:', err);
    return res.status(500).json({ error: 'Erro ao enviar mensagem.' });
  }
});
