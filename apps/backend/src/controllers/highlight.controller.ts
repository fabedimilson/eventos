import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth';

const createHighlightSchema = z.object({
  title: z.string().min(1, 'O título do destaque é obrigatório.'),
  description: z.string().optional(),
  coverUrl: z.string().optional(),
  campus: z.string().optional().default('ALL'),
  eventId: z.string().optional().nullable(),
  order: z.number().optional().default(0),
});

const updateHighlightSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  coverUrl: z.string().optional().nullable(),
  campus: z.string().optional(),
  eventId: z.string().optional().nullable(),
  order: z.number().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export class HighlightController {
  // GET /api/v1/highlights
  async list(req: Request, res: Response) {
    try {
      const { campus } = req.query;

      const where: any = { status: 'ACTIVE' };
      if (campus && campus !== 'ALL') {
        where.OR = [
          { campus: 'ALL' },
          { campus: campus as string },
        ];
      }

      const highlights = await prisma.highlight.findMany({
        where,
        include: {
          event: {
            select: { id: true, title: true, slug: true, bannerUrl: true, startDate: true, endDate: true },
          },
          createdBy: {
            select: { id: true, name: true, avatarUrl: true },
          },
          _count: {
            select: { posts: true },
          },
        },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'desc' },
        ],
      });

      return res.json({ highlights });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao buscar destaques.' });
    }
  }

  // GET /api/v1/highlights/:id
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const highlight = await prisma.highlight.findUnique({
        where: { id },
        include: {
          event: true,
          createdBy: {
            select: { id: true, name: true, avatarUrl: true },
          },
          posts: {
            where: { status: 'ACTIVE' },
            include: {
              user: {
                select: { id: true, name: true, avatarUrl: true, category: true, campus: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!highlight || highlight.status === 'ARCHIVED') {
        return res.status(404).json({ error: 'Destaque não encontrado.' });
      }

      return res.json({ highlight });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao buscar detalhes do destaque.' });
    }
  }

  // POST /api/v1/highlights
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const data = createHighlightSchema.parse(req.body);
      const userId = req.user!.userId;

      const highlight = await prisma.highlight.create({
        data: {
          title: data.title.trim(),
          description: data.description ? data.description.trim() : null,
          coverUrl: data.coverUrl || null,
          campus: data.campus || 'ALL',
          eventId: data.eventId || null,
          order: data.order ?? 0,
          createdById: userId,
          status: 'ACTIVE',
        },
        include: {
          event: {
            select: { id: true, title: true, slug: true, bannerUrl: true },
          },
          createdBy: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });

      return res.status(201).json({
        message: 'Destaque criado com sucesso!',
        highlight,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Erro ao criar destaque.' });
    }
  }

  // PUT /api/v1/highlights/:id
  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = updateHighlightSchema.parse(req.body);

      const existing = await prisma.highlight.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Destaque não encontrado.' });
      }

      const updated = await prisma.highlight.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title.trim() }),
          ...(data.description !== undefined && { description: data.description ? data.description.trim() : null }),
          ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl }),
          ...(data.campus !== undefined && { campus: data.campus }),
          ...(data.eventId !== undefined && { eventId: data.eventId }),
          ...(data.order !== undefined && { order: data.order }),
          ...(data.status !== undefined && { status: data.status }),
        },
        include: {
          event: {
            select: { id: true, title: true, slug: true, bannerUrl: true },
          },
          createdBy: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });

      return res.json({
        message: 'Destaque atualizado com sucesso!',
        highlight: updated,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Erro ao atualizar destaque.' });
    }
  }

  // DELETE /api/v1/highlights/:id
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const existing = await prisma.highlight.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Destaque não encontrado.' });
      }

      await prisma.highlight.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      });

      return res.json({ message: 'Destaque removido com sucesso.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao remover destaque.' });
    }
  }

  // GET /api/v1/highlights/:id/posts
  async listPosts(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const posts = await prisma.eventPost.findMany({
        where: { highlightId: id, status: 'ACTIVE' },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true, category: true, campus: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json({ posts });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao carregar publicações do destaque.' });
    }
  }

  // POST /api/v1/highlights/:id/posts
  async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { content, mediaUrl, mediaType } = req.body;

      if (!content && !mediaUrl) {
        return res.status(400).json({ error: 'A publicação precisa conter texto ou mídia.' });
      }

      const highlight = await prisma.highlight.findUnique({ where: { id } });
      if (!highlight || highlight.status === 'ARCHIVED') {
        return res.status(404).json({ error: 'Destaque não encontrado.' });
      }

      const post = await prisma.eventPost.create({
        data: {
          highlightId: id,
          eventId: highlight.eventId || null,
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
      return res.status(400).json({ error: err.message || 'Erro ao criar publicação no destaque.' });
    }
  }
}

export const highlightController = new HighlightController();
