import { Router } from 'express';
import { campusStructureController } from '../controllers/campusStructure.controller';
import { authMiddleware, requireCanManageHighlights } from '../middlewares/auth';

export const campusStructureRouter = Router();

// Consulta Pública / Autenticada
campusStructureRouter.get('/courses', (req, res) => campusStructureController.listCourses(req, res));
campusStructureRouter.get('/classes', (req, res) => campusStructureController.listClasses(req, res));

// Gestão de Cursos (ADMIN_UNIDADE, ADMIN_MASTER ou SUPER_ADMIN)
campusStructureRouter.post('/courses', authMiddleware, requireCanManageHighlights, (req, res) =>
  campusStructureController.createCourse(req, res)
);

campusStructureRouter.put('/courses/:id', authMiddleware, requireCanManageHighlights, (req, res) =>
  campusStructureController.updateCourse(req, res)
);

campusStructureRouter.delete('/courses/:id', authMiddleware, requireCanManageHighlights, (req, res) =>
  campusStructureController.deleteCourse(req, res)
);

// Gestão de Turmas (ADMIN_UNIDADE, ADMIN_MASTER ou SUPER_ADMIN)
campusStructureRouter.post('/classes', authMiddleware, requireCanManageHighlights, (req, res) =>
  campusStructureController.createClass(req, res)
);

campusStructureRouter.put('/classes/:id', authMiddleware, requireCanManageHighlights, (req, res) =>
  campusStructureController.updateClass(req, res)
);

campusStructureRouter.delete('/classes/:id', authMiddleware, requireCanManageHighlights, (req, res) =>
  campusStructureController.deleteClass(req, res)
);
