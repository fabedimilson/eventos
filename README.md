# 🏛️ Ecossistema de Gestão de Eventos IFAM

> Sistema integrado para Web e Aplicativo Mobile Nativo para o **Instituto Federal do Amazonas (IFAM)**, englobando credenciamento granular por palestra via QR Code dinâmico anti-fraude, transmissões do YouTube ao vivo e on-demand, fluxos de RSVP/Flowup automatizados, emissão de certificados autenticados por hash SHA-256 e Matchmaking/Networking com Chat em tempo real e controle de privacidade.

---

## 🌟 Funcionalidades Principais

1. **Gestão de Eventos com White-Label Dinâmico:**
   - Personalização de paleta de cores (Verde `#1B5E20`, Vermelho `#C62828`, Dark/Light mode), banners, thumbnails e logotipos de patrocinadores.
   - Linha do tempo com catálogo de eventos futuros e históricos realizados.

2. **Check-in Granular por Palestra & QR Code Rotativo:**
   - Modo **Telão / Projetor** de Auditório com código criptográfico HMAC-SHA256 rotativo a cada 15 segundos para impedir que alunos compartilhem fotos do QR Code por WhatsApp.
   - Scanner de alta velocidade no app mobile com confirmação instantânea de presença e cômputo de carga horária.

3. **Integração com YouTube (Live & On-Demand):**
   - Transmissões ao vivo incorporadas na página do evento e no app mobile.
   - Modo gravação pós-evento automático.

4. **Eventos Fechados, Convidados & RSVP (Flowup):**
   - Gestão de convidados para eventos públicos e privados.
   - Status: `Confirmado`, `Recusado` e `Pendente`.
   - Disparador de **Flowup** para envio de notificações em lote a quem não respondeu.

5. **Emissão e Auditoria Pública de Certificados:**
   - Cálculo automático de frequência do participante com base nos check-ins individuais.
   - Geração de PDF oficial estilizado com QR Code de validação.
   - Assinatura digital com hash **SHA-256** e página pública de auditoria (`/validar`).

6. **Networking, Matchmaking & Chat 1-to-1 em Tempo Real:**
   - Diretório de participantes credenciados com filtros por perfil (`ALUNO`, `PROFESSOR`, `TECNICO`, `EXTERNO`).
   - Chat direto em tempo real via **WebSockets (Socket.io)**.
   - **Modo Invisível / Privacidade:** o participante pode ocultar seu perfil para não ser contatado durante o evento.

7. **Dashboard de Analytics em Tempo Real do Organizador:**
   - Gráficos interativos (Recharts) com divisão de inscritos por categoria, funil de RSVP e taxa de comparecimento por sessão.

---

## 🏗️ Estrutura do Monorepo

```
EVENTOS/
├── apps/
│   ├── backend/               # Core API REST & WebSockets (Node.js + Express + Prisma + Socket.io + PDFKit)
│   ├── web-admin/             # Portal Web & Painel do Organizador (Next.js 14 + Tailwind + Recharts)
│   └── mobile-app/            # App Participante (React Native + Expo SDK 51 + Expo Camera + Router)
├── packages/
│   └── types/                 # Tipagens e Enums compartilhados TypeScript
├── docker-compose.yml         # PostgreSQL 16 + Redis 7
└── README.md
```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js 18+ e npm
- Docker & Docker Compose (opcional para PostgreSQL/Redis em produção)

### 1. Inicializar o Backend
```bash
cd apps/backend
npm install
npm run prisma:generate
npm run prisma:seed    # Popula banco SQLite com dados demonstrativos completos do IFAM
npm run dev            # Inicia na porta 4000
```

### 2. Inicializar o Portal Web Admin
```bash
cd apps/web-admin
npm install
npm run dev            # Inicia na porta 3000
```
Acesse no navegador: **[http://localhost:3000](http://localhost:3000)**

### 3. Inicializar o App Mobile
```bash
cd apps/mobile-app
npm install
npx expo start         # Inicie no emulador Android, iOS ou Expo Go
```

---

## 👤 Perfis Pré-Cadastrados para Teste (Seed)

| Perfil | E-mail | Senha | Acesso / Permissões |
| :--- | :--- | :--- | :--- |
| **Super Admin (Professor)** | `admin@ifam.edu.br` | `ifam123456` | Acesso total ao sistema e auditoria |
| **Organizador (Técnico)** | `organizador@ifam.edu.br` | `ifam123456` | Dashboard, Telão QR, RSVP e Emissão em Lote |
| **Aluno IFAM** | `aluno1@ifam.edu.br` | `ifam123456` | Inscrições, Scanner QR, Chat e Certificados |
| **Visitante Externo** | `convidado@empresa.com.br` | `ifam123456` | Participante e Networking |

---

## 🏛️ Identidade Visual do IFAM
- **Verde Institucional Primário:** `#1B5E20` (Dark: `#A5D6A7`)
- **Vermelho Secundário:** `#C62828`
- **Tipografia:** Inter / Sans-Serif moderna
- **Aceleração Visual:** Glassmorphism, Dark/Light Mode e Micro-animações
