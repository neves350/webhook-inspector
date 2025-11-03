# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Webhook Inspector** fullstack application - a tool for capturing and inspecting incoming webhook requests. It's built as a pnpm workspace monorepo with two packages:

- **api**: Node.js backend with Fastify
- **web**: React 19 frontend with Vite

The application allows users to create webhook URLs (via `/capture/*` endpoint), capture incoming webhook requests with full details (headers, body, query params, IP), and inspect/manage captured webhooks through a web interface.

## Development Setup

### Initial Setup

```bash
# Install dependencies (from root)
pnpm install

# Setup API environment
cd api
cp .env.example .env  # Then edit .env to set DATABASE_URL

# Start PostgreSQL
docker-compose up -d

# Run database migrations
pnpm db:generate
pnpm db:migrate

# (Optional) Seed the database
pnpm db:seed
```

### Running the Application

Both services must run simultaneously in separate terminals:

```bash
# Terminal 1 - Start API (from api/)
cd api
pnpm dev
# Runs on http://localhost:3333
# Docs at http://localhost:3333/docs

# Terminal 2 - Start Frontend (from web/)
cd web
pnpm dev
# Runs on http://localhost:5173
```

## Common Commands

### API (Backend)
- `pnpm dev` - Development server with hot reload (uses tsx watch)
- `pnpm format` - Format code with Biome
- `pnpm db:studio` - Open Drizzle Studio (database GUI)
- `pnpm db:generate` - Generate new migrations from schema changes
- `pnpm db:migrate` - Apply pending migrations
- `pnpm db:seed` - Seed the database with sample data

### Web (Frontend)
- `pnpm dev` - Development server
- `pnpm build` - Production build (runs TypeScript check + Vite build)
- `pnpm preview` - Preview production build
- `pnpm format` - Format code with Biome

### Root
- `pnpm format` - Format code across all workspaces with Biome

## Architecture

### Backend (API)

**Stack**: Fastify + Drizzle ORM + PostgreSQL + Zod validation

**Key architectural patterns**:

1. **Type-Safe API with Zod**: Uses `fastify-type-provider-zod` for automatic request/response validation and OpenAPI schema generation. All routes define schemas inline with Zod, providing end-to-end type safety.

2. **Route Plugin Pattern**: Each route is a separate Fastify plugin in [api/src/routes/](api/src/routes/). The server ([api/src/server.ts](api/src/server.ts)) registers all route plugins. Routes export `FastifyPluginAsyncZod` functions.

3. **Database Layer**:
   - Drizzle ORM with PostgreSQL driver
   - Schema defined in [api/src/db/schema/webhooks.ts](api/src/db/schema/webhooks.ts)
   - Database instance exported from [api/src/db/index.ts](api/src/db/index.ts)
   - Uses `casing: "snake_case"` to convert camelCase fields to snake_case in DB
   - UUIDv7 for primary keys (time-sortable UUIDs)

4. **Environment Validation**: [api/src/env.ts](api/src/env.ts) validates env vars with Zod on startup

5. **Path Aliases**: Uses `@/*` to import from `src/` (configured in tsconfig.json)

**API Routes**:
- `POST|GET|PUT|PATCH|DELETE /capture/*` - Captures webhook requests (external-facing)
- `GET /api/webhooks` - List webhooks with cursor-based pagination
- `GET /api/webhooks/:id` - Get single webhook details
- `DELETE /api/webhooks/:id` - Delete a webhook
- `GET /docs` - Swagger/Scalar API documentation

**Webhook Capture Flow**:
The `/capture/*` route uses `app.all()` to accept any HTTP method. It extracts the pathname (strips `/capture` prefix), headers, body, IP, and stores everything in the database. The captured webhook is identified by a UUIDv7 which is returned to the caller.

### Frontend (Web)

**Stack**: React 19 + TanStack Router + Tailwind CSS 4 + Vite

**Key architectural patterns**:

1. **File-Based Routing**: Uses TanStack Router with file-based routing. Routes defined in [web/src/routes/](web/src/routes/). The router plugin auto-generates `routeTree.gen.ts` from the routes directory.

2. **Root Layout**: Minimal root layout in [web/src/routes/__root.tsx](web/src/routes/__root.tsx) - just renders `<Outlet />`

3. **Styling**: Tailwind CSS 4 with Vite plugin, uses Radix UI for components

4. **Router Setup**: Router instance created in [web/src/main.tsx](web/src/main.tsx) with type-safe route tree

## Code Style

This project uses **Biome** (not ESLint/Prettier) for formatting and linting:

- **Indentation**: Tabs (width 2)
- **Line width**: 80 characters
- **Quotes**: Single quotes for JavaScript/TypeScript
- **Semicolons**: As needed (not always)
- **Auto-organize imports**: Enabled

Run `pnpm format` to format code. Biome config is in [biome.json](biome.json).

## Database

**Schema**: Single table `webhooks` with these fields:
- `id` (text, UUIDv7, primary key)
- `method` (text) - HTTP method
- `pathname` (text) - Request path (without /capture prefix)
- `ip` (text) - Client IP address
- `status_code` (integer, default 200)
- `content_type` (text, nullable)
- `content_length` (integer, nullable)
- `query_params` (jsonb, nullable) - Query string parameters
- `headers` (jsonb) - Request headers
- `body` (text, nullable) - Request body as string
- `created_at` (timestamp) - Creation timestamp

**Migrations**: Located in [api/src/db/migrations/](api/src/db/migrations/). Generated with `drizzle-kit generate` and applied with `drizzle-kit migrate`.

**Connection**: PostgreSQL runs in Docker (postgres:17). Default credentials in [api/docker-compose.yml](api/docker-compose.yml):
- User: docker
- Password: docker
- Database: webhooks
- Port: 5432

## Important Notes

- API must have `DATABASE_URL` environment variable set (format: `postgresql://user:pass@host:port/db`)
- The API listens on `0.0.0.0:3333` to allow external webhook connections
- CORS is enabled for all origins in development
- The `/capture/*` route is marked with `hide: true` in OpenAPI docs since it's external-facing
- Cursor-based pagination is used for listing webhooks (using UUIDv7 as cursor)
