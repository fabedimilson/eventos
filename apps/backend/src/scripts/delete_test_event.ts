import { prisma } from '../prisma/client';

async function main() {
  const result = await prisma.event.deleteMany({
    where: {
      OR: [
        { title: { contains: 'Cultura e Arte Amazônica' } },
        { title: { contains: 'Campeonato Interno de Jiu-Jitsu' } },
        { title: { contains: 'Faixa branca' } }
      ]
    }
  });

  console.log(`✅ Limpeza concluída: ${result.count} evento(s) de teste removido(s) do banco!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
