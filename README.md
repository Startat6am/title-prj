# YouTube Transcript Knowledge Base

Pipeline:

YouTube channel -> video discovery -> transcripts -> Neon Postgres -> PostgreSQL full-text search.

AI, embeddings and RAG are intentionally out of scope for the first version.

## Local setup

Requirements:
- Node.js 20+
- Neon Postgres

Install dependencies:

    npm install

Create .env from .env.example and set DATABASE_URL.

Apply migrations using the SQL in migrations/001_initial.sql.

Check the database connection:

    npm run dev -- db:ping

Discover channel videos:

    npm run dev -- discover

## Target channel

Channel ID:

    UCl0p-aoACzTOgnCctzIQWPQ

## Development order

See PLAN.md.