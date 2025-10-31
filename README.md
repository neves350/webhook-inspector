# Node React - Fullstack Project

Projeto fullstack desenvolvido com Node.js e React, utilizando monorepo com pnpm workspaces.

## Tecnologias

### Backend (API)
- **Node.js** com **TypeScript**
- **Fastify** - Framework web
- **Drizzle ORM** - ORM para banco de dados
- **PostgreSQL** - Banco de dados
- **Docker** - Containerização do PostgreSQL
- **Zod** - Validação de schemas
- **Swagger** - Documentação da API
- **Biome** - Formatação de código

### Frontend (Web)
- **React 19**
- **Vite** - Build tool
- **TypeScript**
- **Biome** - Formatação de código

## Pré-requisitos

- Node.js (versão 18 ou superior)
- pnpm (versão 10.13.1)
- Docker e Docker Compose

## Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd node-react
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure o ambiente da API:
```bash
cd api
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Inicie o banco de dados:
```bash
cd api
docker-compose up -d
```

5. Execute as migrações do banco de dados:
```bash
cd api
pnpm db:generate
pnpm db:migrate
```

## Uso

### Desenvolvimento

Para iniciar o projeto em modo de desenvolvimento:

**API (Backend):**
```bash
cd api
pnpm dev
```
A API estará disponível em `http://localhost:3333`

**Web (Frontend):**
```bash
cd web
pnpm dev
```
O frontend estará disponível em `http://localhost:5173`

### Comandos Úteis

**API:**
- `pnpm dev` - Inicia o servidor em modo desenvolvimento
- `pnpm start` - Inicia o servidor em modo produção
- `pnpm db:studio` - Abre o Drizzle Studio para gerenciar o banco
- `pnpm db:generate` - Gera as migrações
- `pnpm db:migrate` - Executa as migrações
- `pnpm format` - Formata o código

**Web:**
- `pnpm dev` - Inicia o servidor de desenvolvimento
- `pnpm build` - Gera o build de produção
- `pnpm preview` - Preview do build de produção
- `pnpm format` - Formata o código

## Estrutura do Projeto

```
node-react/
├── api/              # Backend (Node.js + Fastify)
│   ├── src/
│   │   ├── db/       # Configuração do banco de dados
│   │   ├── routes/   # Rotas da API
│   │   └── server.ts # Servidor principal
│   └── docker-compose.yml
├── web/              # Frontend (React + Vite)
└── package.json      # Configuração do workspace
```

## Documentação da API

Após iniciar o servidor da API, acesse a documentação Swagger em:
- `http://localhost:3333/docs`

## Banco de Dados

O projeto utiliza PostgreSQL rodando em container Docker. As credenciais padrão são:
- Host: localhost
- Porta: 5432
- Usuário: docker
- Senha: docker
- Database: webhooks
