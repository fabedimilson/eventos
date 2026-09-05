import { Router } from 'express';
import { highlightController } from '../controllers/highlight.controller';
import { authMiddleware, requireCanCreateEvent } from '../middlewares/auth';

const router = Router();

// Rotas Públicas / Leitura
router.get('/', (req, res) => highlightController.list(req, res));
router.get('/:id', (req, res) => highlightController.getById(req, res));
router.get('/:id/posts', (req, res) => highlightController.listPosts(req, res));

// Rotas de Usuário Autenticado (Postar no destaque)
router.post('/:id/posts', authMiddleware, (req, res) => highlightController.createPost(req, res));

// Rotas Administrativas / Servidores (Criar, Editar, Excluir Destaques)
router.post('/', authMiddleware, requireCanCreateEvent, (req, res) => highlightController.create(req, res));
router.put('/:id', authMiddleware, requireCanCreateEvent, (req, res) => highlightController.update(req, res));
router.delete('/:id', authMiddleware, requireCanCreateEvent, (req, res) => highlightController.delete(req, res));

export default router;
