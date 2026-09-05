export const ALL_IFAM_CAMPI = [
  'Reitoria IFAM',
  'Campus Manaus - Centro',
  'Campus Manaus - Zona Leste',
  'Campus Manaus - Distrito Industrial',
  'Campus Parintins',
  'Campus Coari',
  'Campus Tabatinga',
  'Campus Maués',
  'Campus São Gabriel da Cachoeira',
  'Campus Humaitá',
  'Campus Itacoatiara',
  'Campus Manacapuru',
  'Campus Tefé',
  'Campus Eirunepé',
  'Campus Lábrea',
  'Campus Presidente Figueiredo',
  'Campus Iranduba',
  'Campus Boca do Acre',
  'Polo de Inovação',
];

export const ALL_UNIFIK_CAMPI_E_INSTITUICOES = ALL_IFAM_CAMPI;

export function matchCampusName(eventLocationOrCampus: string, filterCampus: string): boolean {
  if (!filterCampus || filterCampus === 'ALL' || filterCampus === 'Todos os Campi do IFAM') return true;
  if (!eventLocationOrCampus) return false;

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\b(ifam|campus)\b/g, '')
      .replace(/[^a-z0-9]/g, '');

  const normEvent = normalize(eventLocationOrCampus);
  const normFilter = normalize(filterCampus);

  if (!normEvent || !normFilter) return true;

  return normEvent.includes(normFilter) || normFilter.includes(normEvent);
}

export const USER_CATEGORIES = [
  { value: 'PROFESSOR', label: 'PROFESSOR (Docente / Pesquisador)' },
  { value: 'TECNICO', label: 'TÉCNICO (Administrativo / Gestor)' },
  { value: 'PESQUISADOR', label: 'PESQUISADOR (Colaborador)' },
  { value: 'ALUNO', label: 'ALUNO (Discente / Estudante)' },
  { value: 'EGRESSO', label: 'EGRESSO (Ex-Aluno / Graduado)' },
  { value: 'EXTERNO', label: 'EXTERNO (Comunidade / Visitante)' },
];

export const ALUMNI_EMPLOYMENT_STATUSES = [
  'Empregado (CLT / PJ)',
  'Servidor Público',
  'Empresário / Empreendedor',
  'Estudante (Pós-Graduação / Mestrado / Doutorado)',
  'Profissional Autônomo / Freelancer',
  'Buscando Oportunidades',
  'Outro',
];

export const ALUMNI_EDUCATION_LEVELS = [
  'Ensino Técnico',
  'Graduação (Bacharelado / Licenciatura / Tecnologia)',
  'Pós-Graduação / Especialização',
  'Mestrado',
  'Doutorado',
];

export const ALUMNI_COLLABORATION_OPTIONS = [
  { id: 'PESQUISA', label: 'Participar de Projetos de Pesquisa & Inovação' },
  { id: 'GRUPOS_PESQUISA', label: 'Integrar Grupos de Pesquisa' },
  { id: 'EVENTOS', label: 'Ministrar Palestras, Workshops e Participar de Eventos' },
  { id: 'MENTORIA', label: 'Mentoria de Alunos / Networking' },
];
