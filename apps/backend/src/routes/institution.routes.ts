import { Router } from 'express';
import { institutionController } from '../controllers/institution.controller';
import { authMiddleware, requireRoles, requireCanManageHighlights } from '../middlewares/auth';

export const institutionRouter = Router();

// Rotas Públicas / Consulta
institutionRouter.get('/', (req, res) => institutionController.list(req, res));
institutionRouter.get('/campuses/all', (req, res) => institutionController.listAllCampuses(req, res));
institutionRouter.get('/:code', (req, res) => institutionController.getByCode(req, res));
institutionRouter.get('/:code/campuses', (req, res) => institutionController.listCampuses(req, res));

// Gestão de Instituição (ADMIN_MASTER ou SUPER_ADMIN)
institutionRouter.post('/', authMiddleware, requireRoles('ADMIN_MASTER', 'SUPER_ADMIN'), (req, res) =>
  institutionController.create(req, res)
);

institutionRouter.put('/:id', authMiddleware, requireCanManageHighlights, (req, res) =>
  institutionController.update(req, res)
);

// Gestão de Campi (ADMIN_UNIDADE, ADMIN_MASTER ou SUPER_ADMIN)
institutionRouter.post('/:institutionId/campuses', authMiddleware, requireCanManageHighlights, (req, res) =>
  institutionController.createCampus(req, res)
);

institutionRouter.put('/campuses/:campusId', authMiddleware, requireCanManageHighlights, (req, res) =>
  institutionController.updateCampus(req, res)
);

institutionRouter.delete('/campuses/:campusId', authMiddleware, requireCanManageHighlights, (req, res) =>
  institutionController.deleteCampus(req, res)
);
