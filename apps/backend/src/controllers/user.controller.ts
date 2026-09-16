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

      const currentUserRole = req.user?.role;
      const isMaster = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN_MASTER';

      // 1. Apenas ADMIN_MASTER pode transferir o campus de um usuário
      if (campus && !isMaster) {
        return res.status(403).json({
          error: 'Apenas Administradores Master da Reitoria possuem permissão para transferir o campus de usuários.',
        });
      }

      // 2. Apenas ADMIN_MASTER pode promover alguém a ADMIN_MASTER
      if (role === 'ADMIN_MASTER' && !isMaster) {
        return res.status(403).json({
          error: 'Apenas Administradores Master podem promover usuários para o nível Master.',
        });
      }

      // 3. ADMIN_UNIDADE só pode gerenciar usuários da sua própria unidade
      if (!isMaster) {
        const targetUser = await prisma.user.findUnique({
          where: { id },
          select: { campus: true },
        });
        if (
          targetUser?.campus &&
          req.user?.campus &&
          targetUser.campus.toLowerCase().trim() !== req.user.campus.toLowerCase().trim()
        ) {
          return res.status(403).json({
            error: `Acesso restrito: Você só possui permissão para gerenciar usuários do seu campus (${req.user.campus}).`,
          });
        }
      }

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

  // GET /api/v1/users/:id/public-profile (Perfil público acadêmico com eventos e palestras)
  async getPublicProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          category: true,
          role: true,
          campus: true,
          avatarUrl: true,
          pronoun: true,
          bio: true,
          linkedinUrl: true,
          instagramUrl: true,
          lattesUrl: true,
          interests: true,
          isEgresso: true,
          educationLevel: true,
          employmentStatus: true,
          currentCompanyOrInst: true,
          currentRoleOrCourse: true,
          graduationYear: true,
          courseName: true,
          alumniInterests: true,
          createdAt: true,
          registrations: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  description: true,
                  locationName: true,
                  startDate: true,
                  endDate: true,
                  bannerUrl: true,
                  category: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          certificates: {
            select: {
              id: true,
              validationCode: true,
              totalHoursAwarded: true,
              status: true,
              issuedAt: true,
              event: {
                select: {
                  id: true,
                  title: true,
                },
              },
              session: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
            orderBy: { issuedAt: 'desc' },
          },
          organizedEvents: {
            select: {
              id: true,
              title: true,
              slug: true,
              category: true,
              startDate: true,
              locationName: true,
              bannerUrl: true,
            },
            orderBy: { startDate: 'desc' },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      // Busca sessões onde o usuário é palestrante
      const speakingSessions = await prisma.session.findMany({
        where: {
          speakerName: { contains: user.name },
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              category: true,
              bannerUrl: true,
            },
          },
        },
        orderBy: { startTime: 'desc' },
      });

      return res.json({
        user,
        speakingSessions,
      });
    } catch (err: any) {
      console.error('Erro ao buscar perfil público:', err);
      return res.status(500).json({ error: err.message || 'Erro ao buscar perfil público.' });
    }
  }
}

export const userController = new UserController();
