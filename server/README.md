# CopyPenLM Server

The backend for **CopyPenLM**, an AI-powered learning workspace. CopyPenLM is intended to help learners bring their study material into one workspace and turn it into searchable context, cited conversations, and structured learning artifacts.

The sibling [`client`](../client) package will provide the web interface. This package owns the HTTP API, authentication, PostgreSQL persistence, source ingestion integrations, and future AI processing pipeline.

## Product Overview

A CopyPenLM workspace is a private learning area owned by a user. A workspace can contain:

- **Sources:** PDFs, websites, YouTube videos, plain text, and Markdown.
- **Source chunks:** smaller pieces of source content prepared for retrieval.
- **Conversations:** user and assistant messages with optional citations.
- **Learning artifacts:** summaries, takeaways, flashcards, quizzes, mind maps, and reports.

The intended workflow is:

```text
Create workspace -> import learning sources -> process and chunk content
-> ask cited questions -> generate study artifacts
```

## Current Implementation

Implemented and registered today:

- Better Auth request handling at `ALL /api/auth/*`
- Authenticated workspace CRUD
- Authenticated source listing, lookup, deletion, and bulk deletion
- Source import contracts for text, Markdown, websites, YouTube, and PDFs
- PostgreSQL persistence through Prisma 7
- Website scraping utility through Firecrawl
- Health and root endpoints

The database schema already includes conversations, messages, and learning artifacts, but those API routes and AI generation workflows are not registered yet. The client is also still the default Next.js starter page, so this is an active foundation rather than a finished product.

## Architecture

```text
HTTP request
    -> Express routes
    -> auth middleware and Zod validation
    -> controllers
    -> services
    -> repositories
    -> Prisma 7 + PostgreSQL
```

Important boundaries:

- `src/routes/` registers HTTP endpoints.
- `src/middleware/` handles authentication, errors, and request concerns.
- `src/controllers/` parses requests and formats responses.
- `src/services/` contains workspace and source use cases.
- `src/repository/` contains Prisma data access.
- `src/lib/` contains shared infrastructure such as auth, database, and Firecrawl.
- `prisma/schema.prisma` defines the persisted domain model.

## Stack

- Node.js with TypeScript and native ESM
- Express 5
- Better Auth with Google provider support
- Prisma 7 with the PostgreSQL driver adapter
- PostgreSQL 16 with the `pgvector/pgvector` image
- Zod for request validation
- Multer for multipart file uploads
- Firecrawl for website-to-Markdown extraction

## Prerequisites

- Node.js with npm
- Docker Desktop with Docker Compose
- A Better Auth secret
- A Firecrawl API key for website imports
- Google OAuth credentials if Google sign-in is enabled

## Environment Variables

Create `server/.env` with values appropriate for your environment:

```env
DATABASE_URL="postgresql://copy_pen_lm_user:copy_pen_lm_password@localhost:5432/copy_pen_lm_db"
PORT=8081
CLIENT_URL="http://localhost:3000"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
FIRECRAWL_API_KEY=""
NODE_ENV="development"
```

`DATABASE_URL` must point to the PostgreSQL instance started by the root Docker Compose file. Do not use the development fallback `super-secret` outside local experimentation.

## Run Locally

From the repository root, start PostgreSQL:

```bash
docker compose up -d postgres
```

Install dependencies and prepare Prisma:

```bash
cd server
npm install
npx prisma generate
npx prisma migrate deploy
```

Start the development server:

```bash
npm run dev
```

The API listens on [http://localhost:8081](http://localhost:8081) by default. The frontend runs separately from [`client`](../client):

```bash
cd ../client
npm install
npm run dev
```

## Available Scripts

```bash
npm run dev       # Watch and run src/index.ts with tsx
npm run build     # Compile TypeScript to dist/
npm run start     # Run the compiled server
npx prisma generate
npx prisma migrate deploy
```

## API

The server returns JSON unless noted otherwise. Workspace and source routes require a valid Better Auth session and enforce ownership through `requireAuth` and workspace lookups.

### Public endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Basic server response |
| `GET` | `/health` | Health check; returns `{ "status": "ok" }` |
| `ALL` | `/api/auth/*` | Better Auth endpoints |

### Workspace endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/workspaces` | List the signed-in user's workspaces |
| `POST` | `/api/workspaces` | Create a workspace |
| `GET` | `/api/workspaces/:workspaceId` | Get one owned workspace |
| `PATCH` | `/api/workspaces/:workspaceId` | Update workspace fields |
| `DELETE` | `/api/workspaces/:workspaceId` | Delete a workspace and related records |

Workspace fields include `title`, optional `description`, optional `icon`, and `defaultModel` (`gpt-4o-mini` or `gpt-4o`).

### Source endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/workspaces/:workspaceId/sources` | List sources; supports `q`, `type`, and `status` filters |
| `POST` | `/api/workspaces/:workspaceId/sources` | Create a text or Markdown source |
| `GET` | `/api/workspaces/:workspaceId/sources/:sourceId` | Get one source |
| `DELETE` | `/api/workspaces/:workspaceId/sources/:sourceId` | Delete one source |
| `POST` | `/api/workspaces/:workspaceId/sources/bulk-delete` | Delete sources using `{ "sourceIds": [] }` |
| `POST` | `/api/workspaces/:workspaceId/sources/upload` | Upload a PDF as multipart form data |
| `POST` | `/api/workspaces/:workspaceId/sources/import/website` | Import a URL with Firecrawl |
| `POST` | `/api/workspaces/:workspaceId/sources/import/youtube` | Import a YouTube transcript |

Text and Markdown requests use `{ "type": "TEXT" | "MARKDOWN", "title": "...", "content": "..." }`. Website requests use `{ "url": "...", "title": "..." }`; YouTube requests use `{ "url": "...", "title": "..." }`.

## Database Model

Prisma currently defines:

- Better Auth tables: `User`, `Session`, `Account`, `Verification`
- `Workspace` and its owned `Source` records
- `SourceChunk` records for retrieval-ready content
- `Conversation` and `Message` records with citation JSON
- `LearningArtifact` records with typed JSON content and processing status
- A small `Test` model left over from the initial migration

Source and artifact processing use the statuses `PENDING`, `PROCESSING`, `READY`, and `FAILED`. The migration history is in [`prisma/migrations`](prisma/migrations).

## Known Gaps

This repository is still under active development. In particular:

- The client has no authentication, workspace, source, chat, or artifact screens yet.
- Conversation, search, memory, and learning-artifact endpoints are not implemented.
- Source processing integrations referenced by the service layer are incomplete or commented out, including PDF storage/extraction, YouTube transcripts, and the processing queue.
- The PDF route currently imports a missing `src/middleware/upload.middleware.ts` module.
- JSON body parsing should be enabled in `src/index.ts` before JSON workspace/source requests can work reliably.
- Text and Markdown creation currently validates workspace access but has its persistence call disabled.
- Website imports require `FIRECRAWL_API_KEY`; Google sign-in requires valid Google OAuth credentials.

These gaps describe the current codebase and are useful starting points for implementation work; they are not intended as a promise that every planned workflow is available today.

## Related Documentation

- [`client/README.md`](../client/README.md) - frontend setup and current UI state
- [`prisma/schema.prisma`](prisma/schema.prisma) - database source of truth
- [`src/routes`](src/routes) - registered API routes
