import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { authRouter } from './routes/auth.routes';
import { eventsRouter } from './routes/events.routes';
import { sessionsRouter } from './routes/sessions.routes';
import { rsvpRouter } from './routes/rsvp.routes';
import { certificatesRouter } from './routes/certificates.routes';
import { networkingRouter } from './routes/networking.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { usersRouter } from './routes/users.routes';
import { invitationsRouter } from './routes/invitations.routes';
import { emergenciesRouter } from './routes/emergencies.routes';
import { noticesRouter } from './routes/notices.routes';
import { prisma } from './prisma/client';
import { verifyAccessToken } from './utils/security';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// Rotas da API REST v1
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/events', eventsRouter);
app.use('/api/v1/sessions', sessionsRouter);
app.use('/api/v1/rsvp', rsvpRouter);
app.use('/api/v1/certificates', certificatesRouter);
app.use('/api/v1/networking', networkingRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/invitations', invitationsRouter);
app.use('/api/v1/emergencies', emergenciesRouter);
app.use('/api/v1/notices', noticesRouter);

app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'IFAM Eventos Core API',
    institution: 'Instituto Federal do Amazonas',
  });
});

// ----------------------------------------------------
// GATEWAY WEBSOCKET (SOCKET.IO) EM TEMPO REAL
// ----------------------------------------------------
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token || typeof token !== 'string') {
    return next(new Error('Autenticação WebSocket obrigatória.'));
  }

  try {
    const user = verifyAccessToken(token);
    socket.data.user = user;
    return next();
  } catch (err) {
    return next(new Error('Token WebSocket inválido.'));
  }
});

io.on('connection', (socket) => {
  const user = socket.data.user;
  console.log(`⚡ [Socket.io] Usuário conectado: ${user.email} (${user.userId})`);

  // Entra na sala pessoal do usuário para notificações diretas
  socket.join(`user:${user.userId}`);

  // Entra em uma sala de chat específica
  socket.on('join_room', (roomId: string) => {
    socket.join(`room:${roomId}`);
    console.log(`👤 Usuário ${user.email} entrou na sala de chat ${roomId}`);
  });

  // Envio de mensagem de chat 1-to-1
  socket.on('send_message', async (data: { chatRoomId: string; content: string }) => {
    try {
      const { chatRoomId, content } = data;
      if (!content || !content.trim()) return;

      const message = await prisma.message.create({
        data: {
          chatRoomId,
          senderId: user.userId,
          content: content.trim(),
        },
        include: {
          sender: {
            select: { id: true, name: true, avatarUrl: true, category: true },
          },
        },
      });

      // Emite para todos na sala de chat
      io.to(`room:${chatRoomId}`).emit('new_message', message);

      // Notifica os participantes da sala em tempo real
      const participants = await prisma.chatParticipant.findMany({
        where: { chatRoomId },
        select: { userId: true },
      });

      for (const p of participants) {
        if (p.userId !== user.userId) {
          io.to(`user:${p.userId}`).emit('chat_notification', {
            chatRoomId,
            message,
          });
        }
      }
    } catch (err) {
      console.error('Erro ao processar mensagem no socket:', err);
    }
  });

  // Escuta de eventos em tempo real pelo painel do organizador
  socket.on('join_event_dashboard', (eventId: string) => {
    socket.join(`event_dashboard:${eventId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Usuário desconectado: ${user.email}`);
  });
});

import { reminderService } from './services/reminder.service';

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 IFAM Eventos Backend rodando na porta ${PORT}`);
  console.log(`📍 Endpoint Health Check: http://localhost:${PORT}/health`);
  reminderService.startScheduler();
});
