import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware, requireRoles } from '../middlewares/auth';

export const usersRouter = Router();

// GET /api/v1/users (Protegido - Admin / Organizador lista usuários)
usersRouter.get('/', authMiddleware, requireRoles('ORGANIZADOR', 'ADMIN_UNIDADE', 'SUPER_ADMIN', 'ADMIN_MASTER'), (req, res) => userController.list(req, res));

// GET /api/v1/users/:id/public-profile (Perfil acadêmico público de outro usuário)
usersRouter.get('/:id/public-profile', authMiddleware, (req, res) => userController.getPublicProfile(req, res));

// PATCH /api/v1/users/:id (Protegido - Admin edita função, categoria ou suspende/bloqueia usuário)
usersRouter.patch('/:id', authMiddleware, requireRoles('ADMIN_UNIDADE', 'ADMIN_MASTER', 'SUPER_ADMIN'), (req, res) => userController.update(req, res));
