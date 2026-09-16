import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth';

// Datas padrão do Calendário Acadêmico 2026 para auto-seed se vazio
const DEFAULT_2026_CALENDAR_EVENTS = [
  {
    title: 'Período de Matrículas e Ajustes Curriculares 2026.1',
    description: 'Abertura do sistema acadêmico para confirmação de matrícula e rematrícula online.',
    category: 'MATRICULA',
    startDate: new Date('2026-02-02T08:00:00Z'),
    endDate: new Date('2026-02-06T18:00:00Z'),
    targetAudience: 'TODOS',
    isNoClassDay: false,
  },
  {
    title: 'Início das Aulas do 1º Semestre Letivo 2026',
    description: 'Acolhimento aos calouros e veteranos no campus.',
    category: 'INSTITUCIONAL',
    startDate: new Date('2026-02-09T07:30:00Z'),
    endDate: new Date('2026-02-09T22:00:00Z'),
    targetAudience: 'TODOS',
    isNoClassDay: false,
  },
  {
    title: 'Feriado de Carnaval e Quarta-Feira de Cinzas',
    description: 'Recesso institucional e feriado nacional sem atividades letivas.',
    category: 'FERIADO',
    startDate: new Date('2026-02-16T00:00:00Z'),
    endDate: new Date('2026-02-18T23:59:59Z'),
    targetAudience: 'TODOS',
    isNoClassDay: true,
  },
  {
    title: 'Sábado Letivo Temático de Integração',
    description: 'Reposição de carga horária e oficinas extensionistas.',
    category: 'SABADO_LETIVO',
    startDate: new Date('2026-03-14T08:00:00Z'),
    endDate: new Date('2026-03-14T12:00:00Z'),
    targetAudience: 'TODOS',
    isNoClassDay: false,
  },
  {
    title: 'Período de Avaliações N1 - Ensino Superior e Técnico',
    description: 'Primeira rodada oficial de provas regimentais e entregas de trabalhos parciais.',
    category: 'PROVAS',
    startDate: new Date('2026-04-13T07:30:00Z'),
    endDate: new Date('2026-04-18T22:00:00Z'),
    targetAudience: 'TODOS',
    isNoClassDay: false,
  },
  {
    title: 'Prazo Limite para Depósito de TCC / Monografias 2026.1',
    description: 'Submissão formal dos trabalhos de conclusão de curso para bancas examinadoras.',
    category: 'TCC',
    startDate: new Date('2026-05-25T08:00:00Z'),
    endDate: new Date('2026-05-29T18:00:00Z'),
    targetAudience: 'GRADUACAO',
    isNoClassDay: false,
  },
  {
    title: 'Período de Avaliações N2 e Finais 2026.1',
    description: 'Segunda rodada de avaliações regimentais, exames finais e fechamento de médias.',
    category: 'PROVAS',
    startDate: new Date('2026-06-15T07:30:00Z'),
    endDate: new Date('2026-06-23T22:00:00Z'),
    targetAudience: 'TODOS',
    isNoClassDay: false,
  },
  {
    title: 'Férias Acadêmicas e Recesso Escolar de Meio de Ano',
    description: 'Período de férias docentes e discentes de meio de ano letivo.',
    category: 'FERIAS',
    startDate: new Date('2026-07-01T00:00:00Z'),
    endDate: new Date('2026-07-31T23:59:59Z'),
    targetAudience: 'TODOS',
    isNoClassDay: true,
  },
  {
    title: 'Início do 2º Semestre Letivo 2026.2',
    description: 'Retorno às atividades acadêmicas regulares.',
    category: 'INSTITUCIONAL',
    startDate: new Date('2026-08-03T07:30:00Z'),
    endDate: new Date('2026-08-03T22:00:00Z'),
    targetAudience: 'TODOS',
    isNoClassDay: false,
  },
  {
    title: 'Avaliações N1 - 2º Semestre 2026.2',
    description: 'Primeiro ciclo de avaliações do segundo semestre letivo.',
    category: 'PROVAS',
    startDate: new Date('2026-09-28T07:30:00Z'),
    endDate: new Date('2026-10-03T22:00:00Z'),
    targetAudience: 'TODOS',
    isNoClassDay: false,
  },
  {
    title: 'Avaliações Finais e Encerramento do Ano Letivo 2026',
    description: 'Exames finais e fechamento oficial das atas de notas e diários acadêmicos.',
    category: 'PROVAS',
    startDate: new Date('2026-12-14T07:30:00Z'),
    endDate: new Date('2026-12-19T22:00:00Z'),
    targetAudience: 'TODOS',
    isNoClassDay: false,
  },
];

export class AcademicCalendarController {
  // Auto-seed do calendário acadêmico no primeiro acesso a um campus
  private async ensureDefaultCalendar(campusUnitId: string) {
    const count = await prisma.academicCalendarEvent.count({ where: { campusUnitId } });
    if (count === 0) {
      for (const item of DEFAULT_2026_CALENDAR_EVENTS) {
        await prisma.academicCalendarEvent.create({
          data: {
            campusUnitId,
            yearSemester: '2026.1',
            title: item.title,
            description: item.description,
            category: item.category,
            startDate: item.startDate,
            endDate: item.endDate,
            targetAudience: item.targetAudience,
            isNoClassDay: item.isNoClassDay,
            createdById: 'system',
          },
        });
      }
    }
  }

  // GET /api/v1/academic-calendar (Listar datas por mês/ano e campus com filtros)
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const { campusUnitId, campusName, year, month, category, targetAudience, courseId } = req.query;

      let targetCampusUnitId = campusUnitId as string;

      if (!targetCampusUnitId && campusName) {
        const found = await prisma.campusUnit.findFirst({
          where: { name: { contains: String(campusName), mode: 'insensitive' } },
        });
        if (found) targetCampusUnitId = found.id;
      }

      if (!targetCampusUnitId) {
        const first = await prisma.campusUnit.findFirst({ where: { active: true } });
        if (first) targetCampusUnitId = first.id;
      }

      if (targetCampusUnitId) {
        await this.ensureDefaultCalendar(targetCampusUnitId);
      }

      const where: any = {};
      if (targetCampusUnitId) where.campusUnitId = targetCampusUnitId;
      if (category && category !== 'ALL') where.category = String(category);

      // Filtro de audiência: datas gerais ('TODOS') + datas específicas do nível do usuário
      if (targetAudience && targetAudience !== 'ALL') {
        where.OR = [
          { targetAudience: 'TODOS' },
          { targetAudience: String(targetAudience) },
        ];
      }

      if (courseId && courseId !== 'ALL') {
        where.OR = [
          { courseId: null },
          { courseId: String(courseId) },
        ];
      }

      // Filtro de Mês e Ano se informado
      if (year && month) {
        const y = parseInt(String(year));
        const m = parseInt(String(month)) - 1; // 0-indexed
        const startOfMonth = new Date(Date.UTC(y, m, 1));
        const endOfMonth = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59));

        where.AND = [
          { startDate: { lte: endOfMonth } },
          { endDate: { gte: startOfMonth } },
        ];
      } else if (year) {
        const y = parseInt(String(year));
        const startOfYear = new Date(Date.UTC(y, 0, 1));
        const endOfYear = new Date(Date.UTC(y, 11, 31, 23, 59, 59));
        where.AND = [
          { startDate: { lte: endOfYear } },
          { endDate: { gte: startOfYear } },
        ];
      }

      const events = await prisma.academicCalendarEvent.findMany({
        where,
        include: {
          campusUnit: {
            select: { id: true, name: true, code: true },
          },
          course: {
            select: { id: true, name: true, code: true, level: true },
          },
        },
        orderBy: { startDate: 'asc' },
      });

      return res.json({ events });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao listar datas do calendário.' });
    }
  }

  // GET /api/v1/academic-calendar/export.ics (Exportação padrão iCalendar .ics)
  async exportICS(req: AuthenticatedRequest, res: Response) {
    try {
      const { campusUnitId, campusName, year } = req.query;
      let targetCampusUnitId = campusUnitId as string;

      if (!targetCampusUnitId && campusName) {
        const found = await prisma.campusUnit.findFirst({
          where: { name: { contains: String(campusName), mode: 'insensitive' } },
        });
        if (found) targetCampusUnitId = found.id;
      }

      const where: any = {};
      if (targetCampusUnitId) where.campusUnitId = targetCampusUnitId;

      const events = await prisma.academicCalendarEvent.findMany({
        where,
        include: { campusUnit: true },
        orderBy: { startDate: 'asc' },
      });

      const formatDateToICS = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Unifik//Calendario Academico Multi-Institucional//PT-BR',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Calendário Acadêmico - Unifik',
      ];

      for (const ev of events) {
        icsContent.push('BEGIN:VEVENT');
        icsContent.push(`UID:unifik-${ev.id}@unifik.app`);
        icsContent.push(`DTSTAMP:${formatDateToICS(new Date())}`);
        icsContent.push(`DTSTART:${formatDateToICS(new Date(ev.startDate))}`);
        icsContent.push(`DTEND:${formatDateToICS(new Date(ev.endDate))}`);
        icsContent.push(`SUMMARY:${ev.title}`);
        icsContent.push(`DESCRIPTION:${(ev.description || '').replace(/\n/g, '\\n')}`);
        icsContent.push(`CATEGORIES:${ev.category}`);
        if (ev.campusUnit) {
          icsContent.push(`LOCATION:${ev.campusUnit.name}`);
        }
        icsContent.push('STATUS:CONFIRMED');
        icsContent.push('END:VEVENT');
      }

      icsContent.push('END:VCALENDAR');

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="calendario-academico-unifik.ics"');
      return res.send(icsContent.join('\r\n'));
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao gerar arquivo ICS.' });
    }
  }

  // POST /api/v1/academic-calendar (Admin adiciona data no calendário)
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        campusUnitId,
        yearSemester,
        title,
        description,
        category,
        startDate,
        endDate,
        isNoClassDay,
        targetAudience,
        courseId,
      } = req.body;

      if (!campusUnitId || !title || !category || !startDate || !endDate) {
        return res.status(400).json({ error: 'Campus, título, categoria, data inicial e final são obrigatórios.' });
      }

      const event = await prisma.academicCalendarEvent.create({
        data: {
          campusUnitId,
          yearSemester: yearSemester || '2026.1',
          title,
          description,
          category,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isNoClassDay: Boolean(isNoClassDay),
          targetAudience: targetAudience || 'TODOS',
          courseId: courseId || null,
          createdById: req.user?.userId || 'admin',
        },
      });

      return res.status(201).json({ event });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao adicionar data no calendário.' });
    }
  }

  // POST /api/v1/academic-calendar/import-csv (Admin importa datas em lote)
  async importCSV(req: AuthenticatedRequest, res: Response) {
    try {
      const { campusUnitId, items } = req.body;
      if (!campusUnitId || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Campus e lista de itens válidos são obrigatórios.' });
      }

      const created: any[] = [];
      for (const item of items) {
        if (!item.title || !item.startDate || !item.endDate) continue;

        const ev = await prisma.academicCalendarEvent.create({
          data: {
            campusUnitId,
            yearSemester: item.yearSemester || '2026.1',
            title: item.title,
            description: item.description || null,
            category: item.category || 'INSTITUCIONAL',
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
            isNoClassDay: Boolean(item.isNoClassDay),
            targetAudience: item.targetAudience || 'TODOS',
            createdById: req.user?.userId || 'admin',
          },
        });
        created.push(ev);
      }

      return res.status(201).json({
        message: `${created.length} datas importadas com sucesso!`,
        count: created.length,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao importar datas.' });
    }
  }

  // PUT /api/v1/academic-calendar/:id (Admin edita data)
  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        category,
        startDate,
        endDate,
        isNoClassDay,
        targetAudience,
        courseId,
        yearSemester,
      } = req.body;

      const event = await prisma.academicCalendarEvent.update({
        where: { id },
        data: {
          title,
          description,
          category,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          isNoClassDay: isNoClassDay !== undefined ? Boolean(isNoClassDay) : undefined,
          targetAudience,
          courseId: courseId || null,
          yearSemester,
        },
      });

      return res.json({ event });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao atualizar data do calendário.' });
    }
  }

  // DELETE /api/v1/academic-calendar/:id (Admin remove data)
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await prisma.academicCalendarEvent.delete({ where: { id } });
      return res.json({ message: 'Data removida com sucesso.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao remover data do calendário.' });
    }
  }
}

export const academicCalendarController = new AcademicCalendarController();
