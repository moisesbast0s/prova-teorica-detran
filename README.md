# 🚦 Simulado DETRAN — Prova Teórica

> Plataforma de simulados para a prova teórica do DETRAN, com banco de mais de 1.500 questões oficiais, progresso por usuário, histórico de simulados e estatísticas de desempenho.

---

## 📋 Sobre o Projeto

O **Simulado DETRAN** é uma aplicação web full-stack que permite ao candidato à CNH estudar e se preparar para a prova teórica do DETRAN com questões reais. A plataforma oferece:

- **Treino rápido** (10, 15 ou 20 questões) para revisar temas específicos
- **Simulado oficial** com 30 questões, 60 minutos e critério de aprovação idêntico ao exame real (20 de 30)
- Seleção de temas por área de conhecimento
- Timer regressivo durante o simulado
- Resultado detalhado com gabarito e explicação de cada questão
- Dashboard com histórico, média de aproveitamento e gráfico de evolução
- Sistema de conta sem senha — basta informar um nome

---

## 🗂️ Estrutura de Rotas

| Rota | Descrição |
|---|---|
| `/login` | Entrada na plataforma (sem senha) |
| `/dashboard` | Painel com estatísticas e simulados recentes |
| `/simulado` | Configuração de um novo simulado |
| `/simulado/[id]` | Execução do simulado com timer e navegação |
| `/simulado/[id]/resultado` | Resultado final com gabarito detalhado |
| `/historico` | Lista completa de todos os simulados realizados |
| `/questoes` | Navegação livre por questões do banco |

---

## ❓ As Questões

As questões são extraídas do repositório público [`oprimodev/teorical-questions-detran`](https://github.com/oprimodev/teorical-questions-detran), que contém questões organizadas por tema e dificuldade.

### Temas disponíveis

| Tema | Descrição |
|---|---|
| Sinalização Viária | Placas, semáforos e marcas viárias |
| Legislação de Trânsito | CTB e normas gerais |
| Direção Defensiva | Técnicas de condução segura |
| Primeiros Socorros | Atendimento em acidentes |
| Meio Ambiente | Impacto ambiental do trânsito |
| Mecânica Básica | Manutenção e funcionamento do veículo |
| Cidadania | Direitos e deveres no trânsito |

### Distribuição e seleção de questões

- O banco possui **mais de 1.500 questões** únicas, cada uma com 4 alternativas (a, b, c, d).
- A cada novo simulado, as questões são selecionadas **priorizando aquelas que o usuário ainda não acertou**, evitando a repetição de questões já dominadas.
- Dentro de cada tema, a seleção é proporcional ao número de questões pedidas.
- As alternativas de cada questão são **embaralhadas** no momento do seed do banco — a ordem exibida é fixa por questão.

---

## 👤 Como o Sistema Armazena a Conta do Usuário

A plataforma **não exige e-mail, senha ou cadastro externo**. O fluxo de autenticação é:

1. O usuário acessa `/login` e informa apenas um nome.
2. O navegador gera automaticamente um **ID único (UUID)** e armazena no `localStorage` como `guestId`.
3. Esse ID é combinado com o nome para formar um e-mail interno fictício no formato `guest-<id>@guest.local`.
4. O sistema verifica se esse e-mail já existe no banco:
   - **Se sim**: a sessão é vinculada ao usuário existente (conta retomada).
   - **Se não**: um novo usuário é criado automaticamente.
5. A sessão é mantida via **JWT** (NextAuth.js), sem necessidade de banco de sessão.

> **Privacidade**: nenhuma informação pessoal real é coletada. O nome digitado é apenas para exibição e pode ser alterado a qualquer momento.

> **Persistência**: enquanto o `localStorage` do navegador não for limpo, o usuário retorna à mesma conta ao acessar novamente o site.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Linguagem | TypeScript |
| ORM / Banco | [Prisma](https://www.prisma.io) + PostgreSQL |
| Autenticação | [NextAuth.js v5](https://authjs.dev) (Credentials provider) |
| UI | [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| Gráficos | [Recharts](https://recharts.org) |
| Runtime | Node.js |

---

## ⚙️ Requisitos para Rodar Localmente

- **Node.js** ≥ 18
- **npm** ≥ 9
- **PostgreSQL** ≥ 14 instalado e em execução

---

## 🚀 Como Rodar Localmente

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/prova-teorica-detran.git
cd prova-teorica-detran
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha os valores:

```bash
cp .env.example .env
```

Edite o `.env`:

```env
# String de conexão com o banco PostgreSQL
DATABASE_URL="postgresql://usuario:senha@localhost:5432/detran_quiz"

# Segredo para assinar os JWTs (gere com: openssl rand -base64 33)
NEXTAUTH_SECRET="seu-segredo-aqui"

# URL base da aplicação
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Configure o banco de dados

**Opção A — Script automático (Linux):**

```bash
sudo bash setup-db.sh
```

Isso cria a role e o banco `detran_quiz` no PostgreSQL local.

**Opção B — Manual:**

```bash
# Crie o banco pelo psql ou pelo seu cliente preferido
createdb detran_quiz
```

### 5. Execute as migrations e o seed

```bash
# Aplica o schema ao banco
npx prisma migrate deploy

# Popula o banco com as questões (~1.500 questões)
npx prisma db seed
```

> O seed baixa automaticamente as questões do GitHub se o arquivo `prisma/questions.json` não existir localmente. Esse arquivo está no `.gitignore` por ser grande (~1,2 MB) — mas pode ser gerado com o seed.

### 6. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## 📁 Estrutura do Projeto

```
prova-teorica-detran/
├── app/
│   ├── (app)/            # Rotas protegidas (requer login)
│   │   ├── dashboard/
│   │   ├── historico/
│   │   ├── questoes/
│   │   └── simulado/
│   ├── (auth)/           # Rotas públicas
│   │   └── login/
│   └── api/              # API Routes (Next.js)
│       ├── auth/
│       ├── simulado/
│       └── stats/
├── components/           # Componentes React reutilizáveis
├── lib/                  # Lógica de negócio, auth, prisma
├── prisma/
│   ├── schema.prisma     # Modelo do banco de dados
│   ├── seed.ts           # Script de seed das questões
│   └── questions.json    # Banco de questões (gerado pelo seed)
├── types/                # Tipagens TypeScript compartilhadas
├── .env.example          # Template de variáveis de ambiente
└── setup-db.sh           # Script de setup do PostgreSQL
```

---

## 🗃️ Modelo de Dados (Resumo)

```
User ──< SimulatedExam ──< Attempt >── Question ──< Option
```

- **User**: conta do usuário (identificada por e-mail interno)
- **SimulatedExam**: cada simulado criado, com temas, total de questões e resultado
- **Attempt**: resposta do usuário para cada questão de um simulado
- **Question**: questão com enunciado, tema e dificuldade
- **Option**: as 4 alternativas de cada questão (uma marcada como correta)

---

## 📝 Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run start` | Inicia o servidor de produção |
| `npm run lint` | Executa o ESLint |
| `npx prisma studio` | Abre o painel visual do banco de dados |
| `npx prisma db seed` | Popula o banco com as questões |
| `npx prisma migrate dev` | Cria e aplica novas migrations |

---

## 🔑 Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | ✅ | String de conexão PostgreSQL |
| `NEXTAUTH_SECRET` | ✅ | Segredo para JWT (mín. 32 caracteres) |
| `NEXTAUTH_URL` | ✅ | URL base da aplicação |

---

## 📄 Licença

Este projeto é de uso educacional. As questões são de domínio público conforme o repositório fonte.
