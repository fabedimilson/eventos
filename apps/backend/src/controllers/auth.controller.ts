import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middlewares/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  cpf: z.string().optional(),
  category: z.enum(['ALUNO', 'PROFESSOR', 'TECNICO', 'EXTERNO']).default('EXTERNO'),
  matriculaOrSiape: z.string().optional(),
  campus: z.string().optional(),
  role: z.enum(['PARTICIPANTE', 'ORGANIZADOR', 'SUPER_ADMIN']).default('PARTICIPANTE'),
});

const updateProfileSchema = z.object({
  name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  category: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  campus: z.string().optional(),
  matriculaOrSiape: z.string().optional(),
  linkedinUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  lattesUrl: z.string().optional(),
  interests: z.string().optional(),
});

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Erro ao efetuar login.' });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);
      return res.status(201).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Erro ao registrar usuário.' });
    }
  }

  async me(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const user = await authService.getProfile(userId);
      return res.json({ user });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao buscar perfil.' });
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const data = updateProfileSchema.parse(req.body);
      const result = await authService.updateProfile(userId, data);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Erro ao atualizar perfil do usuário.' });
    }
  }

  async updatePrivacy(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { isInvisibleInNetworking } = req.body;
      const result = await authService.updatePrivacy(userId, isInvisibleInNetworking);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao atualizar privacidade.' });
    }
  }
}

export const authController = new AuthController();
