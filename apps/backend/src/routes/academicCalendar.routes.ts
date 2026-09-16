import { Router } from 'express';
import { academicCalendarController } from '../controllers/academicCalendar.controller';
import { authMiddleware, requireCanManageHighlights } from '../middlewares/auth';

export const academicCalendarRouter = Router();

// Rotas Públicas / Consulta
academicCalendarRouter.get('/', (req, res) => academicCalendarController.list(req, res));
academicCalendarRouter.get('/export.ics', (req, res) => academicCalendarController.exportICS(req, res));

// Gestão de Calendário (ADMIN_UNIDADE, ADMIN_MASTER ou SUPER_ADMIN)
academicCalendarRouter.post('/', authMiddleware, requireCanManageHighlights, (req, res) =>
  academicCalendarController.create(req, res)
);

academicCalendarRouter.post('/import-csv', authMiddleware, requireCanManageHighlights, (req, res) =>
  academicCalendarController.importCSV(req, res)
);

academicCalendarRouter.put('/:id', authMiddleware, requireCanManageHighlights, (req, res) =>
  academicCalendarController.update(req, res)
);

academicCalendarRouter.delete('/:id', authMiddleware, requireCanManageHighlights, (req, res) =>
  academicCalendarController.delete(req, res)
);
