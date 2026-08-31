import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware, requireRoles } from '../middlewares/auth';

export const usersRouter = Router();

// GET /api/v1/users (Protegido - Admin / Organizador lista usuários)
usersRouter.get('/', authMiddleware, requireRoles('ORGANIZADOR', 'SUPER_ADMIN'), (req, res) => userController.list(req, res));

// PATCH /api/v1/users/:id (Protegido - Super Admin edita função ou suspende usuário)
usersRouter.patch('/:id', authMiddleware, requireRoles('SUPER_ADMIN'), (req, res) => userController.update(req, res));
