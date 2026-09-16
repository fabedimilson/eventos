import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth';

// Campi padrão do IFAM para auto-seed se banco estiver vazio
const DEFAULT_IFAM_CAMPUSES = [
  { name: 'Campus Manaus Centro', code: 'CMC', city: 'Manaus', state: 'AM' },
  { name: 'Campus Distrito Industrial', code: 'CDI', city: 'Manaus', state: 'AM' },
  { name: 'Campus Manaus Zona Leste', code: 'CMZL', city: 'Manaus', state: 'AM' },
  { name: 'Campus Parintins', code: 'CPAR', city: 'Parintins', state: 'AM' },
  { name: 'Campus Itacoatiara', code: 'CITA', city: 'Itacoatiara', state: 'AM' },
  { name: 'Campus Tabatinga', code: 'CTAB', city: 'Tabatinga', state: 'AM' },
  { name: 'Campus Coari', code: 'CCOA', city: 'Coari', state: 'AM' },
  { name: 'Campus Tefé', code: 'CTEF', city: 'Tefé', state: 'AM' },
  { name: 'Campus Presidente Figueiredo', code: 'CPRF', city: 'Presidente Figueiredo', state: 'AM' },
  { name: 'Campus Maués', code: 'CMAU', city: 'Maués', state: 'AM' },
];

export class InstitutionController {
  // Inicialização / Seed automático da primeira instituição (IFAM) se vazia
  private async ensureDefaultInstitution() {
    const count = await prisma.institution.count();
    if (count === 0) {
      const ifam = await prisma.institution.create({
        data: {
          name: 'Instituto Federal de Educação, Ciência e Tecnologia do Amazonas',
          code: 'ifam',
          primaryColor: '#1B5E20',
          secondaryColor: '#10B981',
          websiteUrl: 'https://www.ifam.edu.br',
          status: 'ACTIVE',
          campuses: {
            create: DEFAULT_IFAM_CAMPUSES.map((c) => ({
              name: c.name,
              code: c.code,
              city: c.city,
              state: c.state,
              active: true,
            })),
          },
        },
        include: { campuses: true },
      });
      return ifam;
    }
    return null;
  }

  // GET /api/v1/institutions (Listar todas as instituições ativas)
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      await this.ensureDefaultInstitution();

      const institutions = await prisma.institution.findMany({
        where: { status: 'ACTIVE' },
        include: {
          _count: {
            select: { campuses: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      return res.json({ institutions });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao listar instituições.' });
    }
  }

  // GET /api/v1/institutions/:code (Obter instituição com todos os seus campi e branding)
  async getByCode(req: AuthenticatedRequest, res: Response) {
    try {
      await this.ensureDefaultInstitution();
      const code = String(req.params.code).toLowerCase();

      const institution = await prisma.institution.findUnique({
        where: { code },
        include: {
          campuses: {
            where: { active: true },
            orderBy: { name: 'asc' },
          },
        },
      });

      if (!institution) {
        return res.status(404).json({ error: 'Instituição não encontrada.' });
      }

      return res.json({ institution });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao buscar instituição.' });
    }
  }

  // GET /api/v1/institutions/:code/campuses (Listar campi da instituição)
  async listCampuses(req: AuthenticatedRequest, res: Response) {
    try {
      await this.ensureDefaultInstitution();
      const code = String(req.params.code).toLowerCase();

      const institution = await prisma.institution.findUnique({
        where: { code },
        include: {
          campuses: {
            orderBy: { name: 'asc' },
          },
        },
      });

      if (!institution) {
        return res.status(404).json({ error: 'Instituição não encontrada.' });
      }

      return res.json({ campuses: institution.campuses });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao listar campi.' });
    }
  }

  // GET /api/v1/institutions/campuses/all (Listar todos os campi ativos)
  async listAllCampuses(req: AuthenticatedRequest, res: Response) {
    try {
      await this.ensureDefaultInstitution();
      const campuses = await prisma.campusUnit.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      });
      return res.json({ campuses });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao listar campi.' });
    }
  }

  // POST /api/v1/institutions (ADMIN_MASTER: Cadastrar nova instituição)
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, code, cnpj, primaryColor, secondaryColor, websiteUrl, logoUrl } = req.body;
      if (!name || !code) {
        return res.status(400).json({ error: 'Nome e código (slug) da instituição são obrigatórios.' });
      }

      const cleanCode = String(code).toLowerCase().trim().replace(/[^a-z0-9-]/g, '');

      const existing = await prisma.institution.findUnique({ where: { code: cleanCode } });
      if (existing) {
        return res.status(400).json({ error: 'Já existe uma instituição com este código/slug.' });
      }

      const institution = await prisma.institution.create({
        data: {
          name,
          code: cleanCode,
          cnpj,
          primaryColor: primaryColor || '#1B5E20',
          secondaryColor: secondaryColor || '#10B981',
          websiteUrl,
          logoUrl,
          status: 'ACTIVE',
        },
      });

      return res.status(201).json({ institution });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao cadastrar instituição.' });
    }
  }

  // PUT /api/v1/institutions/:id (Admin atualiza dados/branding da instituição)
  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, primaryColor, secondaryColor, websiteUrl, logoUrl, bannerUrl } = req.body;

      const institution = await prisma.institution.update({
        where: { id },
        data: {
          name,
          primaryColor,
          secondaryColor,
          websiteUrl,
          logoUrl,
          bannerUrl,
        },
      });

      return res.json({ institution });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao atualizar instituição.' });
    }
  }

  // POST /api/v1/institutions/:institutionId/campuses (Admin da Unidade / Master cadastra novo campus)
  async createCampus(req: AuthenticatedRequest, res: Response) {
    try {
      const { institutionId } = req.params;
      const { name, code, city, state, address } = req.body;

      if (!name || !code) {
        return res.status(400).json({ error: 'Nome e sigla/código do campus são obrigatórios.' });
      }

      const campus = await prisma.campusUnit.create({
        data: {
          institutionId,
          name,
          code: String(code).toUpperCase().trim(),
          city: city || 'Manaus',
          state: state || 'AM',
          address,
          active: true,
        },
      });

      return res.status(201).json({ campus });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao cadastrar campus.' });
    }
  }

  // PUT /api/v1/institutions/campuses/:campusId (Admin edita campus)
  async updateCampus(req: AuthenticatedRequest, res: Response) {
    try {
      const { campusId } = req.params;
      const { name, code, city, state, address, active } = req.body;

      const campus = await prisma.campusUnit.update({
        where: { id: campusId },
        data: {
          name,
          code: code ? String(code).toUpperCase().trim() : undefined,
          city,
          state,
          address,
          active: active !== undefined ? Boolean(active) : undefined,
        },
      });

      return res.json({ campus });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao atualizar campus.' });
    }
  }

  // DELETE /api/v1/institutions/campuses/:campusId (Admin desativa/remove campus)
  async deleteCampus(req: AuthenticatedRequest, res: Response) {
    try {
      const { campusId } = req.params;

      const campus = await prisma.campusUnit.update({
        where: { id: campusId },
        data: { active: false },
      });

      return res.json({ message: 'Campus desativado com sucesso.', campus });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao desativar campus.' });
    }
  }
}

export const institutionController = new InstitutionController();
