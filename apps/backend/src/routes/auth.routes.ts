import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth';

export const authRouter = Router();

// POST /api/v1/auth/login
authRouter.post('/login', (req, res) => authController.login(req, res));

// POST /api/v1/auth/register
authRouter.post('/register', (req, res) => authController.register(req, res));

// GET /api/v1/auth/me
authRouter.get('/me', authMiddleware, (req, res) => authController.me(req, res));

// PATCH /api/v1/auth/profile (Foto, Bio, Campus, Nome)
authRouter.patch('/profile', authMiddleware, (req, res) => authController.updateProfile(req, res));

// PATCH /api/v1/auth/privacy (Modo Invisível no Networking)
authRouter.patch('/privacy', authMiddleware, (req, res) => authController.updatePrivacy(req, res));
