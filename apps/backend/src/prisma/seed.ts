import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateSha256, generateValidationCode } from '../utils/security';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed do IFAM Eventos...');

  // Limpeza de tabelas
  await prisma.message.deleteMany();
  await prisma.chatParticipant.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.invitationRSVP.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.session.deleteMany();
  await prisma.eventSponsor.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('ifam123456', 10);

  // 1. Criação de Usuários de Diferentes Categorias
  const adminUser = await prisma.user.create({
    data: {
      name: 'Dr. Carlos Eduardo Menezes',
      email: 'admin@ifam.edu.br',
      passwordHash: defaultPasswordHash,
      cpf: '111.222.333-44',
      role: 'SUPER_ADMIN',
      category: 'PROFESSOR',
      matriculaOrSiape: 'SIAPE-982143',
      campus: 'Campus Manaus Centro',
      bio: 'Diretor de Pesquisa e Extensão no IFAM.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    },
  });

  const orgUser = await prisma.user.create({
    data: {
      name: 'Mariana Vasconcelos',
      email: 'organizador@ifam.edu.br',
      passwordHash: defaultPasswordHash,
      cpf: '222.333.444-55',
      role: 'ORGANIZADOR',
      category: 'TECNICO',
      matriculaOrSiape: 'SIAPE-543129',
      campus: 'Campus Manaus Zona Leste',
      bio: 'Coordenadora de Eventos e Relações Institucionais.',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
    },
  });

  const aluno1 = await prisma.user.create({
    data: {
      name: 'Lucas Silva Amazônida',
      email: 'aluno1@ifam.edu.br',
      passwordHash: defaultPasswordHash,
      cpf: '333.444.555-66',
      role: 'PARTICIPANTE',
      category: 'ALUNO',
      matriculaOrSiape: '20241010998',
      campus: 'Campus Manaus Centro',
      bio: 'Estudante de Análise e Desenvolvimento de Sistemas.',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200',
      isInvisibleInNetworking: false,
    },
  });

  const aluno2 = await prisma.user.create({
    data: {
      name: 'Beatriz Pereira Rocha',
      email: 'aluno2@ifam.edu.br',
      passwordHash: defaultPasswordHash,
      cpf: '444.555.666-77',
      role: 'PARTICIPANTE',
      category: 'ALUNO',
      matriculaOrSiape: '20231040881',
      campus: 'Campus Coari',
      bio: 'Pesquisadora júnior em Visão Computacional e IoT.',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
      isInvisibleInNetworking: false,
    },
  });

  const externoUser = await prisma.user.create({
    data: {
      name: 'Eng. Roberto Albuquerque',
      email: 'convidado@empresa.com.br',
      passwordHash: defaultPasswordHash,
      cpf: '555.666.777-88',
      role: 'PARTICIPANTE',
      category: 'EXTERNO',
      campus: 'Polo Industrial de Manaus',
      bio: 'Tech Lead em Inteligência Artificial no Polo Digital.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      isInvisibleInNetworking: false,
    },
  });

  // 2. Criação do Evento 1: Simpósio de Tecnologia
  const mainEvent = await prisma.event.create({
    data: {
      organizerId: orgUser.id,
      title: 'I Simpósio de Tecnologia e Inovação da Amazônia - IFAM 2026',
      slug: 'simposio-tecnologia-ifam-2026',
      description: 'O maior encontro de tecnologia, computação aplicada, bioeconomia e sustentabilidade da Região Norte, promovido pelo IFAM.',
      locationName: 'IFAM Campus Manaus Centro',
      locationAddress: 'Av. Sete de Setembro, 1975 - Centro, Manaus - AM',
      visibility: 'PUBLIC',
      isPublished: true,
      startDate: new Date('2026-08-25T08:30:00Z'),
      endDate: new Date('2026-08-27T18:00:00Z'),
      bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
      thumbnailUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600',
      primaryColor: '#1B5E20', // Verde IFAM
      secondaryColor: '#C62828', // Vermelho IFAM
      themeMode: 'light',
      sponsors: {
        create: [
          {
            name: 'FAPEAM',
            logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=150',
            tier: 'REALIZACAO',
            order: 1,
          },
          {
            name: 'Polo Digital de Manaus',
            logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150',
            tier: 'PATROCINIO_OURO',
            order: 2,
          },
        ],
      },
    },
  });

  // 2.1 Criação do Evento 2: Semana Nacional de Ciência e Tecnologia 2026 (SNCT - Ciência Delas)
  const snctEvent = await prisma.event.create({
    data: {
      organizerId: adminUser.id,
      title: 'Semana Nacional de Ciência e Tecnologia 2026 - SNCT IFAM: "Ciência Delas"',
      slug: 'snct-ifam-2026-ciencia-delas',
      description: 'Edição oficial da SNCT 2026 com a temática nacional "Ciência Delas", celebrando e impulsionando o protagonismo das mulheres na pesquisa científica, inovação tecnológica, robótica, biotecnologia e sustentabilidade na Amazônia.',
      locationName: 'IFAM Campus Manaus Centro',
      locationAddress: 'Av. Sete de Setembro, 1975 - Centro, Manaus - AM',
      visibility: 'PUBLIC',
      isPublished: true,
      startDate: new Date('2026-10-26T08:00:00Z'),
      endDate: new Date('2026-10-29T18:00:00Z'),
      bannerUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200', // Foto de mulheres pesquisadoras na bancada de biotecnologia
      thumbnailUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600',
      primaryColor: '#0D532B', // Verde Esmeralda Institucional SNCT/IFAM
      secondaryColor: '#9C27B0', // Roxo/Púrpura representativo da Ciência Delas
      themeMode: 'light',
      sponsors: {
        create: [
          {
            name: 'MCTI - Ministério da Ciência, Tecnologia e Inovação',
            logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150',
            tier: 'REALIZACAO',
            order: 1,
          },
          {
            name: 'CNPq / FAPEAM',
            logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=150',
            tier: 'FOMENTO_PESQUISA',
            order: 2,
          },
        ],
      },
    },
  });

  // Palestras da SNCT 2026
  await prisma.session.create({
    data: {
      eventId: snctEvent.id,
      title: 'Conferência Magna: Mulheres na Fronteira da Ciência Amazônica e Biotecnologia',
      description: 'Painel de abertura sobre trajetórias inspiradoras de cientistas mulheres liderando projetos de ponta em biomas tropicais.',
      speakerName: 'Dra. Clarice Peixoto & Painel de Pesquisadoras do IFAM/INPA',
      speakerBio: 'Doutora em Genética e Conservação da Biodiversidade.',
      speakerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
      room: 'Auditório Central Gilberto Mestrinho',
      startTime: new Date('2026-10-26T09:00:00Z'),
      endTime: new Date('2026-10-26T11:30:00Z'),
      workloadHours: 2.5,
      youtubeLiveUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      isLiveActive: true,
    },
  });

  await prisma.session.create({
    data: {
      eventId: snctEvent.id,
      title: 'Mostra Científica: Robótica, Inteligência Artificial e Meninas nas Exatas',
      description: 'Apresentação prática de protótipos de robôs, sensores IoT para florestas e modelos computacionais desenvolvidos por alunas dos cursos técnicos e de graduação do IFAM.',
      speakerName: 'Equipe de Robótica Feminina do IFAM',
      speakerBio: 'Estudantes e orientadoras do Laboratório de Automação.',
      speakerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200',
      room: 'Ginásio Tecnológico - Espaço Maker',
      startTime: new Date('2026-10-27T14:00:00Z'),
      endTime: new Date('2026-10-27T17:30:00Z'),
      workloadHours: 3.5,
      youtubeLiveUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      isLiveActive: false,
    },
  });

  await prisma.session.create({
    data: {
      eventId: snctEvent.id,
      title: 'Mesa Redonda: Bioeconomia Circular e Inovação Sustentável no Polo Industrial',
      description: 'Debate sobre patentes verdes, cosméticos sustentáveis a partir de frutos amazônicos e transferência de tecnologia com a indústria.',
      speakerName: 'Profa. Dra. Samara Albuquerque & Convidadas da Indústria',
      speakerBio: 'Coordenadora do Núcleo de Inovação Tecnológica (NIT/IFAM).',
      speakerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      room: 'Auditório 02 - Campus Manaus Centro',
      startTime: new Date('2026-10-28T10:00:00Z'),
      endTime: new Date('2026-10-28T12:00:00Z'),
      workloadHours: 2.0,
      youtubeLiveUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      isLiveActive: false,
    },
  });

  // 3. Palestras e Sessões do Evento com links do YouTube
  const session1 = await prisma.session.create({
    data: {
      eventId: mainEvent.id,
      title: 'Keynote de Abertura: O Futuro da IA e Bioinformática na Amazônia',
      description: 'Discussão sobre preservação florestal e processamento massivo de dados com IA.',
      speakerName: 'Dra. Helena Tavares (INPA/IFAM)',
      speakerBio: 'Pesquisadora sênior em computação científica e biomas tropicais.',
      speakerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200',
      room: 'Auditório Principal',
      startTime: new Date('2026-08-25T09:00:00Z'),
      endTime: new Date('2026-08-25T10:30:00Z'),
      workloadHours: 2.0,
      youtubeLiveUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Link de live
      isLiveActive: true,
    },
  });

  const session2 = await prisma.session.create({
    data: {
      eventId: mainEvent.id,
      title: 'Hands-on: Construindo Aplicações em Nuvem com Next.js e TypeScript',
      description: 'Workshop prático focado em desenvolvimento web moderno e escalabilidade.',
      speakerName: 'Prof. Marcos Andrade (IFAM)',
      speakerBio: 'Docente de Engenharia de Software no IFAM.',
      speakerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      room: 'Laboratório de Redes 03',
      startTime: new Date('2026-08-25T14:00:00Z'),
      endTime: new Date('2026-08-25T17:00:00Z'),
      workloadHours: 3.5,
      youtubeLiveUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      recordingUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      isLiveActive: false,
    },
  });

  const session3 = await prisma.session.create({
    data: {
      eventId: mainEvent.id,
      title: 'Mesa Redonda: Mercado de TI e Oportunidades no Polo Industrial de Manaus',
      description: 'Executivos da indústria discutem as habilidades mais demandadas no Amazonas.',
      speakerName: 'Painel com Especialistas do PIM',
      speakerBio: 'Líderes de tecnologia e inovação industrial.',
      speakerAvatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200',
      room: 'Auditório Principal',
      startTime: new Date('2026-08-26T10:00:00Z'),
      endTime: new Date('2026-08-26T12:00:00Z'),
      workloadHours: 2.0,
      youtubeLiveUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      isLiveActive: false,
    },
  });

  // 4. Inscrições
  await prisma.registration.createMany({
    data: [
      { eventId: mainEvent.id, userId: aluno1.id, code: 'REG-ALUNO-001' },
      { eventId: mainEvent.id, userId: aluno2.id, code: 'REG-ALUNO-002' },
      { eventId: mainEvent.id, userId: externoUser.id, code: 'REG-EXT-003' },
      { eventId: mainEvent.id, userId: adminUser.id, code: 'REG-ADM-004' },
    ],
  });

  // 5. Check-ins de presença já realizados
  await prisma.checkIn.createMany({
    data: [
      { sessionId: session1.id, userId: aluno1.id, method: 'QR_CODE_SCAN' },
      { sessionId: session1.id, userId: aluno2.id, method: 'QR_CODE_SCAN' },
      { sessionId: session1.id, userId: externoUser.id, method: 'QR_CODE_SCAN' },
      { sessionId: session2.id, userId: aluno1.id, method: 'QR_CODE_SCAN' },
    ],
  });

  // 6. Convites RSVP com Flowup
  await prisma.invitationRSVP.createMany({
    data: [
      {
        eventId: mainEvent.id,
        guestEmail: 'secretario.educacao@am.gov.br',
        guestName: 'Dr. Fernando Siqueira (SEDUC/AM)',
        status: 'CONFIRMED',
        token: 'token-convite-seduc-2026',
        confirmedAt: new Date(),
      },
      {
        eventId: mainEvent.id,
        guestEmail: 'reitor@ufam.edu.br',
        guestName: 'Prof. Sylvio Puga (Reitoria UFAM)',
        status: 'PENDING',
        token: 'token-convite-ufam-2026',
        followupCount: 1,
        lastNotifiedAt: new Date(),
      },
      {
        eventId: mainEvent.id,
        guestEmail: 'diretor.tecnico@suframa.gov.br',
        guestName: 'Conselheiro SUFRAMA',
        status: 'DECLINED',
        token: 'token-convite-suframa-2026',
        declinedAt: new Date(),
      },
    ],
  });

  // 7. Certificado Emitido Demonstrativo
  const valCode = generateValidationCode('IFAM');
  const certHash = generateSha256(`${aluno1.id}:${mainEvent.id}:${valCode}:5.5`);
  await prisma.certificate.create({
    data: {
      eventId: mainEvent.id,
      userId: aluno1.id,
      validationCode: valCode,
      sha256Hash: certHash,
      totalHoursAwarded: 5.5,
      status: 'ISSUED',
    },
  });

  // 8. Mensagens de Chat 1-a-1 no Networking
  const chatRoom = await prisma.chatRoom.create({
    data: {
      eventId: mainEvent.id,
      participants: {
        create: [
          { userId: aluno1.id },
          { userId: externoUser.id },
        ],
      },
    },
  });

  await prisma.message.createMany({
    data: [
      {
        chatRoomId: chatRoom.id,
        senderId: externoUser.id,
        content: 'Olá Lucas! Gostei muito da sua pergunta no Keynote sobre bioinformática. Você já estagia na área?',
        sentAt: new Date(Date.now() - 3600000),
      },
      {
        chatRoomId: chatRoom.id,
        senderId: aluno1.id,
        content: 'Olá Roberto! Que bacana conectar por aqui. Estou no 4º período do IFAM e desenvolvendo meu TCC sobre o tema!',
        sentAt: new Date(Date.now() - 1800000),
      },
    ],
  });

  console.log('✅ Seed executado com sucesso!');
  console.log('👤 Usuários criados:');
  console.log(' - Admin: admin@ifam.edu.br | ifam123456');
  console.log(' - Organizador: organizador@ifam.edu.br | ifam123456');
  console.log(' - Aluno: aluno1@ifam.edu.br | ifam123456');
  console.log(' - Convidado: convidado@empresa.com.br | ifam123456');
  console.log(`🎫 Código de Validação do Certificado de Teste: ${valCode}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
