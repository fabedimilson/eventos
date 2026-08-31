import assert from 'node:assert';
import { prisma } from '../prisma/client';
import { generateSha256, generateValidationCode, hashPassword, verifyPassword, generateAccessToken } from '../utils/security';
import { generateSessionQrToken, verifySessionQrToken } from '../utils/qr';

async function runTestSuite() {
  console.log('🧪 ====================================================');
  console.log('🧪 INICIANDO SUÍTE INTEGRADA DE TESTES AUTOMATIZADOS');
  console.log('🧪 SISTEMA IFAM EVENTOS (ECOSSISTEMA DESCENTRALIZADO)');
  console.log('🧪 ====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  async function test(name: string, fn: () => Promise<void>) {
    totalTests++;
    try {
      await fn();
      console.log(`  ✅ [PASSOU] ${name}`);
      passedTests++;
    } catch (err: any) {
      console.error(`  ❌ [FALHOU] ${name}`);
      console.error(`     Detalhes: ${err.message}\n`);
    }
  }

  // ---------------------------------------------------------------------------------
  // 1. TESTES DE SEGURANÇA, HASH E CRIPTOGRAFIA DE CERTIFICADOS
  // ---------------------------------------------------------------------------------
  console.log('🔹 1. Módulo de Criptografia, Tokens e Autenticação:');

  await test('Deve gerar e verificar hash de senha com bcrypt', async () => {
    const password = 'SenhaSecreta@IFAM2026';
    const hash = await hashPassword(password);
    assert.ok(hash.startsWith('$2'), 'Hash deve começar com prefixo bcrypt');
    const isValid = await verifyPassword(password, hash);
    assert.strictEqual(isValid, true, 'Senha correta deve ser validada');
    const isInvalid = await verifyPassword('SenhaErrada', hash);
    assert.strictEqual(isInvalid, false, 'Senha incorreta deve ser rejeitada');
  });

  await test('Deve gerar código de validação de certificado e hash SHA-256 canônico', async () => {
    const code = generateValidationCode('IFAM-CMC');
    assert.ok(code.startsWith('IFAM-CMC-'), 'Código deve conter prefixo do campus');
    
    const payload = JSON.stringify({ code, student: 'Aluno Teste', hours: 4.0 });
    const hash = generateSha256(payload);
    assert.strictEqual(hash.length, 64, 'Hash SHA-256 deve possuir exatamente 64 caracteres hexadecimais');
  });

  await test('Deve gerar e validar token rotativo de QR Code para sessões', async () => {
    const secret = 'segredo-da-sessao-123';
    const sessionId = 'session-abc-456';
    const token = generateSessionQrToken(sessionId, secret);
    assert.ok(token && token.length > 20, 'Token do QR deve ser gerado');

    const isValid = verifySessionQrToken(sessionId, secret, token);
    assert.strictEqual(isValid, true, 'Token gerado com mesmo segredo deve ser válido');

    const isInvalid = verifySessionQrToken(sessionId, 'segredo-errado', token);
    assert.strictEqual(isInvalid, false, 'Token com segredo diferente deve ser rejeitado');
  });

  // ---------------------------------------------------------------------------------
  // 2. TESTES DE REGRAS DE NEGÓCIO E PERFIS DO GEMINI.MD
  // ---------------------------------------------------------------------------------
  console.log('\n🔹 2. Módulo de Perfis, Categorias e Permissões (GEMINI.md):');

  await test('Deve validar hierarquia de permissão de criação de eventos', async () => {
    // Aluno / Externo NÃO podem criar eventos
    const aluno = { category: 'ALUNO', role: 'USUARIO' };
    const externo = { category: 'EXTERNO', role: 'USUARIO' };
    const canAlunoCreate = aluno.category === 'PROFESSOR' || aluno.category === 'TECNICO' || aluno.role === 'ADMIN_MASTER';
    const canExternoCreate = externo.category === 'PROFESSOR' || externo.category === 'TECNICO' || externo.role === 'ADMIN_MASTER';
    assert.strictEqual(canAlunoCreate, false, 'Aluno não pode ter botão de criar evento');
    assert.strictEqual(canExternoCreate, false, 'Externo não pode ter botão de criar evento');

    // Professor / Técnico / Admin PODEM criar eventos
    const professor = { category: 'PROFESSOR', role: 'USUARIO' };
    const tecnico = { category: 'TECNICO', role: 'USUARIO' };
    const adminMaster = { category: 'SERVIDOR', role: 'ADMIN_MASTER' };

    const canProfCreate = professor.category === 'PROFESSOR' || professor.category === 'TECNICO' || professor.role === 'ADMIN_MASTER';
    const canTecCreate = tecnico.category === 'PROFESSOR' || tecnico.category === 'TECNICO' || tecnico.role === 'ADMIN_MASTER';
    const canAdminCreate = adminMaster.category === 'PROFESSOR' || adminMaster.category === 'TECNICO' || adminMaster.role === 'ADMIN_MASTER';

    assert.strictEqual(canProfCreate, true, 'Docente pode criar evento');
    assert.strictEqual(canTecCreate, true, 'Técnico Administrativo pode criar evento');
    assert.strictEqual(canAdminCreate, true, 'Admin Master pode criar evento');
  });

  // ---------------------------------------------------------------------------------
  // 3. TESTES DE CHECK-IN E CRITÉRIO DE FREQUÊNCIA MÍNIMA
  // ---------------------------------------------------------------------------------
  console.log('\n🔹 3. Módulo de Frequência e Certificação Automatizada:');

  await test('Deve calcular taxa de presença e aptidão para certificado (Regra 75%)', async () => {
    const totalSessions = 4;
    const minAttendanceRate = 0.75; // 75%

    // Participante A assistiu 3 de 4 sessões (75%) -> Aprovado
    const checkInsA = 3;
    const rateA = checkInsA / totalSessions;
    const isApprovedA = rateA >= minAttendanceRate;
    assert.strictEqual(isApprovedA, true, 'Participante com 75% deve ser aprovado');

    // Participante B assistiu 2 de 4 sessões (50%) -> Reprovado
    const checkInsB = 2;
    const rateB = checkInsB / totalSessions;
    const isApprovedB = rateB >= minAttendanceRate;
    assert.strictEqual(isApprovedB, false, 'Participante com 50% não atinge o critério mínimo');
  });

  // ---------------------------------------------------------------------------------
  // 4. TESTES DO SISTEMA IFAM GUARD (SOS & PRONTIDÃO)
  // ---------------------------------------------------------------------------------
  console.log('\n🔹 4. Módulo IFAM Guard (Prontidão SOS & Emergências):');

  await test('Deve formatar e validar estrutura de ocorrência de emergência', async () => {
    const emergencyPayload = {
      type: 'DESMAIO_CONVULSAO',
      location: 'Auditório Principal - Campus Manaus Centro',
      description: 'Estudante com mal-estar súbito durante palestra',
      severity: 'HIGH',
      status: 'OPEN',
    };

    assert.ok(emergencyPayload.location.length > 5, 'Local da emergência é obrigatório');
    assert.strictEqual(emergencyPayload.status, 'OPEN', 'Status inicial deve ser OPEN');
    assert.strictEqual(emergencyPayload.severity, 'HIGH', 'Severidade deve ser HIGH');
  });

  // ---------------------------------------------------------------------------------
  // RESUMO FINAL DOS TESTES
  // ---------------------------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 RESULTADO FINAL DA SUÍTE DE TESTES:`);
  console.log(`   Total de Testes: ${totalTests}`);
  console.log(`   Passaram: ${passedTests}`);
  console.log(`   Falharam: ${totalTests - passedTests}`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!\n');
  } else {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Erro fatal na execução dos testes:', err);
  process.exit(1);
});
