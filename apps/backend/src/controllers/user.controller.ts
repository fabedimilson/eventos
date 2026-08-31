import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth';

export class UserController {
  // GET /api/v1/users (Listar todos os usuários para gestão do Admin)
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const { search, role, campus } = req.query;

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: String(search) } },
          { email: { contains: String(search) } },
        ];
      }
      if (role) {
        where.role = String(role);
      }
      if (campus) {
        where.campus = String(campus);
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          category: true,
          campus: true,
          avatarUrl: true,
          bio: true,
          isSuspended: true,
          createdAt: true,
          _count: {
            select: {
              registrations: true,
              organizedEvents: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json({ users });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao listar usuários.' });
    }
  }

  // PATCH /api/v1/users/:id (Super Admin edita função, categoria ou suspende conta)
  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { role, category, campus, isSuspended, name } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(role && { role }),
          ...(category && { category }),
          ...(campus && { campus }),
          ...(name && { name }),
          ...(typeof isSuspended === 'boolean' && { isSuspended }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          category: true,
          campus: true,
          isSuspended: true,
        },
      });

      return res.json({
        message: 'Usuário atualizado com sucesso!',
        user,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Erro ao atualizar usuário.' });
    }
  }
}

export const userController = new UserController();
