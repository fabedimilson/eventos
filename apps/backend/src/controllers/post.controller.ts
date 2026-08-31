import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth';

export class PostController {
  // GET /api/v1/events/:id/posts (Listar feed social do evento)
  async listByEvent(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const posts = await prisma.eventPost.findMany({
        where: { eventId: id, status: 'ACTIVE' },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true, category: true, campus: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json({ posts });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao carregar publicações do evento.' });
    }
  }

  // POST /api/v1/events/:id/posts (Criar publicação no feed do evento)
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { content, mediaUrl, mediaType } = req.body;

      if (!content && !mediaUrl) {
        return res.status(400).json({ error: 'A publicação precisa conter texto ou mídia.' });
      }

      const post = await prisma.eventPost.create({
        data: {
          eventId: id,
          userId: req.user!.userId,
          content: content ? content.trim() : null,
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || 'IMAGE',
          status: 'ACTIVE',
        },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true, category: true, campus: true },
          },
        },
      });

      return res.status(201).json({
        message: 'Publicação realizada com sucesso!',
        post,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Erro ao criar publicação.' });
    }
  }

  // POST /api/v1/events/posts/:postId/report (Denunciar publicação)
  async report(req: AuthenticatedRequest, res: Response) {
    try {
      const { postId } = req.params;
      const { reason, details } = req.body;
      const userId = req.user!.userId;

      if (!reason) {
        return res.status(400).json({ error: 'Por favor, informe o motivo da denúncia.' });
      }

      const post = await prisma.eventPost.findUnique({
        where: { id: postId },
      });

      if (!post) {
        return res.status(404).json({ error: 'Publicação não encontrada.' });
      }

      await prisma.postReport.create({
        data: {
          postId,
          userId,
          reason,
          details: details ? details.trim() : null,
        },
      });

      // Atualiza o status do post para FLAGGED caso tenha mais de 2 denúncias
      const reportCount = await prisma.postReport.count({ where: { postId } });
      if (reportCount >= 2) {
        await prisma.eventPost.update({
          where: { id: postId },
          data: { status: 'FLAGGED' },
        });
      }

      return res.json({ message: 'Denúncia enviada aos moderadores com sucesso. Obrigado por contribuir para a comunidade!' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao enviar denúncia.' });
    }
  }

  // DELETE /api/v1/events/posts/:postId (Remover/Arquivar publicação - Moderador, Criador do Evento ou Autor)
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { postId } = req.params;
      const userId = req.user!.userId;
      const role = req.user!.role;

      const post = await prisma.eventPost.findUnique({
        where: { id: postId },
        include: { event: true },
      });

      if (!post) {
        return res.status(404).json({ error: 'Publicação não encontrada.' });
      }

      const isAuthor = post.userId === userId;
      const isEventOrganizer = post.event.organizerId === userId;
      const isAdmin = role === 'ADMIN_MASTER' || role === 'ADMIN_UNIDADE';

      if (!isAuthor && !isEventOrganizer && !isAdmin) {
        return res.status(403).json({ error: 'Você não tem permissão para remover esta publicação.' });
      }

      await prisma.eventPost.update({
        where: { id: postId },
        data: { status: 'ARCHIVED' },
      });

      return res.json({ message: 'Publicação removida com sucesso.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao remover publicação.' });
    }
  }

  // GET /api/v1/events/admin/reports (Listar publicações denunciadas para os moderadores)
  async listReports(req: AuthenticatedRequest, res: Response) {
    try {
      const reports = await prisma.postReport.findMany({
        include: {
          post: {
            include: {
              user: {
                select: { id: true, name: true, email: true, category: true, campus: true },
              },
              event: {
                select: { id: true, title: true, slug: true },
              },
            },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json({ reports });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao listar denúncias.' });
    }
  }

  // PATCH /api/v1/events/admin/reports/:reportId/resolve (Resolver denúncia: manter post ou banir)
  async resolveReport(req: AuthenticatedRequest, res: Response) {
    try {
      const { reportId } = req.params;
      const { action } = req.body; // 'BAN_POST' | 'DISMISS'

      const report = await prisma.postReport.findUnique({
        where: { id: reportId },
        include: { post: true },
      });

      if (!report) {
        return res.status(404).json({ error: 'Denúncia não encontrada.' });
      }

      if (action === 'BAN_POST') {
        await prisma.eventPost.update({
          where: { id: report.postId },
          data: { status: 'ARCHIVED' },
        });
      } else if (action === 'DISMISS') {
        await prisma.eventPost.update({
          where: { id: report.postId },
          data: { status: 'ACTIVE' },
        });
      }

      await prisma.postReport.delete({
        where: { id: reportId },
      });

      return res.json({ message: 'Denúncia processada com sucesso!' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao processar moderação.' });
    }
  }
}

export const postController = new PostController();

