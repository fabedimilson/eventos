import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth';

// Cursos e Turmas padrão para seed inicial da unidade
const DEFAULT_COURSES = [
  // ENSINO SUPERIOR / GRADUAÇÃO
  {
    level: 'GRADUACAO',
    name: 'Engenharia de Software',
    code: 'BS-ESOFT',
    classes: ['ESOFT11', 'ESOFT31', 'ESOFT51', 'ESOFT71'],
  },
  {
    level: 'GRADUACAO',
    name: 'Licenciatura em Química',
    code: 'LIC-QUI',
    classes: ['QUI11', 'QUI31', 'QUI51'],
  },
  {
    level: 'GRADUACAO',
    name: 'Tecnologia em Processos Químicos',
    code: 'CST-TPQ',
    classes: ['TPQ11', 'TPQ21', 'TPQ41'],
  },
  {
    level: 'GRADUACAO',
    name: 'Licenciatura em Matemática',
    code: 'LIC-MAT',
    classes: ['MAT11', 'MAT31'],
  },
  // TÉCNICO INTEGRADO
  {
    level: 'TECNICO_INTEGRADO',
    name: 'Técnico em Informática',
    code: 'TEC-INF',
    classes: ['INF11', 'INF21', 'INF31', 'INF41'],
  },
  {
    level: 'TECNICO_INTEGRADO',
    name: 'Técnico em Mecânica',
    code: 'TEC-MEC',
    classes: ['MEC11', 'MEC21', 'MEC31'],
  },
  {
    level: 'TECNICO_INTEGRADO',
    name: 'Técnico em Eletrotécnica',
    code: 'TEC-ELETRO',
    classes: ['ELE11', 'ELE21', 'ELE31'],
  },
  {
    level: 'TECNICO_INTEGRADO',
    name: 'Técnico em Edificações',
    code: 'TEC-EDIF',
    classes: ['EDIF11', 'EDIF21', 'EDIF31'],
  },
  // TÉCNICO SUBSEQUENTE
  {
    level: 'TECNICO_SUBSEQUENTE',
    name: 'Técnico em Manutenção e Suporte em Informática',
    code: 'SUB-MSI',
    classes: ['MSI11-NOT', 'MSI21-NOT'],
  },
  // PÓS-GRADUAÇÃO
  {
    level: 'POS_GRADUACAO',
    name: 'Especialização em Inteligência Artificial Aplicada',
    code: 'POS-IA',
    classes: ['IA-2026.1'],
  },
];

export class CampusStructureController {
  // Garante seed de cursos na primeira busca por campus
  private async ensureDefaultCourses(campusUnitId: string) {
    const count = await prisma.campusCourse.count({ where: { campusUnitId } });
    if (count === 0) {
      for (const item of DEFAULT_COURSES) {
        await prisma.campusCourse.create({
          data: {
            campusUnitId,
            level: item.level,
            name: item.name,
            code: item.code,
            active: true,
            classes: {
              create: item.classes.map((className) => ({
                name: className,
                active: true,
                yearSemester: '2026.1',
              })),
            },
          },
        });
      }
    }
  }

  // GET /api/v1/campus-structure/courses (Listar cursos de um campus)
  async listCourses(req: AuthenticatedRequest, res: Response) {
    try {
      const { campusUnitId, campusName, level } = req.query;

      let targetCampusUnitId = campusUnitId as string;

      // Se passou nome de campus em vez de ID (ex: "Campus Manaus Centro")
      if (!targetCampusUnitId && campusName) {
        const found = await prisma.campusUnit.findFirst({
          where: { name: { contains: String(campusName), mode: 'insensitive' } },
        });
        if (found) targetCampusUnitId = found.id;
      }

      // Se ainda não achou, pega o primeiro campus disponível como fallback
      if (!targetCampusUnitId) {
        const firstCampus = await prisma.campusUnit.findFirst({ where: { active: true } });
        if (firstCampus) targetCampusUnitId = firstCampus.id;
      }

      if (targetCampusUnitId) {
        await this.ensureDefaultCourses(targetCampusUnitId);
      }

      const where: any = { active: true };
      if (targetCampusUnitId) where.campusUnitId = targetCampusUnitId;
      if (level && level !== 'ALL') where.level = String(level);

      const courses = await prisma.campusCourse.findMany({
        where,
        include: {
          classes: {
            where: { active: true },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: [{ level: 'asc' }, { name: 'asc' }],
      });

      return res.json({ courses });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao listar cursos.' });
    }
  }

  // GET /api/v1/campus-structure/classes (Listar turmas de um curso)
  async listClasses(req: AuthenticatedRequest, res: Response) {
    try {
      const { courseId } = req.query;
      if (!courseId) {
        return res.status(400).json({ error: 'Identificador do curso é obrigatório.' });
      }

      const classes = await prisma.campusClass.findMany({
        where: { courseId: String(courseId), active: true },
        orderBy: { name: 'asc' },
      });

      return res.json({ classes });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao listar turmas.' });
    }
  }

  // POST /api/v1/campus-structure/courses (Admin cria curso)
  async createCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const { campusUnitId, level, name, code } = req.body;
      if (!campusUnitId || !level || !name) {
        return res.status(400).json({ error: 'Campus, nível e nome do curso são obrigatórios.' });
      }

      const course = await prisma.campusCourse.create({
        data: {
          campusUnitId,
          level,
          name,
          code,
          active: true,
        },
      });

      return res.status(201).json({ course });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao criar curso.' });
    }
  }

  // PUT /api/v1/campus-structure/courses/:id (Admin edita curso)
  async updateCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { level, name, code, active } = req.body;

      const course = await prisma.campusCourse.update({
        where: { id },
        data: {
          level,
          name,
          code,
          active: active !== undefined ? Boolean(active) : undefined,
        },
      });

      return res.json({ course });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao atualizar curso.' });
    }
  }

  // DELETE /api/v1/campus-structure/courses/:id (Admin desativa curso)
  async deleteCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const course = await prisma.campusCourse.update({
        where: { id },
        data: { active: false },
      });

      return res.json({ message: 'Curso desativado com sucesso.', course });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao desativar curso.' });
    }
  }

  // POST /api/v1/campus-structure/classes (Admin cria turma)
  async createClass(req: AuthenticatedRequest, res: Response) {
    try {
      const { courseId, name, shift, yearSemester } = req.body;
      if (!courseId || !name) {
        return res.status(400).json({ error: 'Curso e nome da turma são obrigatórios.' });
      }

      const campusClass = await prisma.campusClass.create({
        data: {
          courseId,
          name,
          shift,
          yearSemester,
          active: true,
        },
      });

      return res.status(201).json({ class: campusClass });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao criar turma.' });
    }
  }

  // PUT /api/v1/campus-structure/classes/:id (Admin edita turma)
  async updateClass(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, shift, yearSemester, active } = req.body;

      const campusClass = await prisma.campusClass.update({
        where: { id },
        data: {
          name,
          shift,
          yearSemester,
          active: active !== undefined ? Boolean(active) : undefined,
        },
      });

      return res.json({ class: campusClass });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao atualizar turma.' });
    }
  }

  // DELETE /api/v1/campus-structure/classes/:id (Admin desativa turma)
  async deleteClass(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const campusClass = await prisma.campusClass.update({
        where: { id },
        data: { active: false },
      });

      return res.json({ message: 'Turma desativada com sucesso.', class: campusClass });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao desativar turma.' });
    }
  }
}

export const campusStructureController = new CampusStructureController();
