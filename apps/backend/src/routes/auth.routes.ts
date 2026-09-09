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

// POST /api/v1/auth/forgot-password
authRouter.post('/forgot-password', (req, res) => authController.forgotPassword(req, res));

// POST /api/v1/auth/verify-reset-code
authRouter.post('/verify-reset-code', (req, res) => authController.verifyResetCode(req, res));

// POST /api/v1/auth/reset-password
authRouter.post('/reset-password', (req, res) => authController.resetPassword(req, res));

// PATCH /api/v1/auth/privacy (Modo Invisível no Networking)
authRouter.patch('/privacy', authMiddleware, (req, res) => authController.updatePrivacy(req, res));
