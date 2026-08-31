import { prisma } from '../prisma/client';

export class ReminderService {
  /**
   * Verifica eventos que iniciam em aproximadamente 24h
   * e dispara notificações no sistema e simulação de e-mail para os participantes.
   */
  async checkAndSend24hReminders() {
    try {
      const now = new Date();
      const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      // Busca eventos publicados iniciando entre 23h e 25h a partir de agora
      const upcomingEvents = await prisma.event.findMany({
        where: {
          isPublished: true,
          startDate: {
            gte: in23Hours,
            lte: in25Hours,
          },
        },
        include: {
          registrations: {
            where: {
              reminderSentAt: null,
            },
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });

      let totalSent = 0;

      for (const event of upcomingEvents) {
        for (const reg of event.registrations) {
          if (!reg.user) continue;

          // 1. Cria a notificação interna no banco de dados
          await prisma.notification.create({
            data: {
              userId: reg.userId,
              eventId: event.id,
              type: 'REMINDER_24H',
              title: `⏰ Falta 24h para o evento: ${event.title}`,
              message: `Olá ${reg.user.name}, o evento "${event.title}" começa amanhã! Confirme sua participação no sistema e prepare seu bilhete com QR Code.`,
            },
          });

          // 2. Log de Simulação do Envio de E-mail
          console.log(
            `📧 [E-MAIL DISPARADO - FOLLOW-UP 24H] Enviado para ${reg.user.email} | Evento: "${event.title}" | Início: ${event.startDate.toISOString()}`
          );

          // 3. Atualiza timestamp do disparo na inscrição
          await prisma.registration.update({
            where: { id: reg.id },
            data: { reminderSentAt: new Date() },
          });

          totalSent++;
        }
      }

      if (totalSent > 0) {
        console.log(`✅ [REMINDER SERVICE] Disparados ${totalSent} lembrete(s) de follow-up 24h com sucesso.`);
      }

      return { totalSent, eventsChecked: upcomingEvents.length };
    } catch (err: any) {
      console.error('❌ Erro no ReminderService:', err);
      return { totalSent: 0, error: err.message };
    }
  }

  startScheduler(intervalMinutes = 15) {
    // Executa a primeira checagem após 10 segundos
    setTimeout(() => {
      this.checkAndSend24hReminders();
    }, 10000);

    // Executa ciclicamente no intervalo definido (padrão: a cada 15 minutos)
    setInterval(() => {
      this.checkAndSend24hReminders();
    }, intervalMinutes * 60 * 1000);

    console.log(`⏳ [REMINDER SERVICE] Scheduler de follow-up 24h iniciado (intervalo: ${intervalMinutes} min).`);
  }
}

export const reminderService = new ReminderService();
