# YouTube Transcript Knowledge Base — Implementation Plan

## Goal

Build a reliable pipeline for one YouTube channel:

YouTube channel → discover videos → fetch transcripts → store in Neon Postgres → full-text search

AI / embeddings / RAG are explicitly out of scope for the first version. The data model should nevertheless leave room to add semantic search later without rebuilding the ingestion pipeline.

## Target channel

https://www.youtube.com/channel/UCl0p-aoACzTOgnCctzIQWPQ

## Technology

- GitHub — source code, versioning, and GitHub Actions
- Node.js / TypeScript — ingestion tooling
- get-youtube-transcript — transcript retrieval
- Neon Postgres — persistent database
- PostgreSQL Full-Text Search — initial search
- Vercel — web application/API later

## Phase 0 — Project foundation

- [ ] Define Node.js + TypeScript project structure
- [ ] Add environment variable configuration
- [ ] Add linting / formatting
- [ ] Add basic test setup
- [ ] Add .env.example
- [ ] Document local development and required secrets

## Phase 1 — Discover all channel videos

- [ ] Implement channel video discovery without requiring the YouTube Data API
- [ ] Extract stable YouTube video IDs
- [ ] Capture basic metadata where available: video ID, title, URL, published date, description
- [ ] Handle pagination / continuation when the channel contains many videos
- [ ] Deduplicate video IDs
- [ ] Save discovery results before transcript downloading so the process can resume

### Acceptance criteria

- Running discovery twice does not create duplicates
- The process can resume after interruption
- We can produce a count of discovered videos
- Discovery failures are clearly reported

## Phase 2 — Transcript downloader

Use get-youtube-transcript as the initial transcript engine.

- [ ] Implement transcript download for one video
- [ ] Prefer desired language(s), with configurable fallback
- [ ] Store the original segment structure: text, start time, duration
- [ ] Preserve the full transcript text
- [ ] Add retry with exponential/backoff delay
- [ ] Add rate limiting between requests
- [ ] Never lose successful transcripts because another video failed
- [ ] Record failure reason and allow failed videos to be retried
- [ ] Make the downloader resumable

### Important operational constraint

The transcript CLI is documented as a best-effort, single-video tool and explicitly warns that bulk extraction, datacenter/server use, and aggressive unattended requests can be throttled by YouTube. Therefore the first implementation should be conservative and resumable rather than firing hundreds of requests concurrently.

## Phase 3 — Neon database

Create migrations for:

### videos

- id
- youtube_id — unique
- title
- description
- youtube_url
- published_at
- duration if available
- created_at
- updated_at

### transcripts

- id
- video_id
- language
- text
- status
- error_message
- created_at
- updated_at

### transcript_segments

- id
- transcript_id
- segment_index
- start_seconds
- duration_seconds
- text

Add appropriate foreign keys, unique constraints, and indexes.

## Phase 4 — Import pipeline

- [ ] Connect ingestion process to Neon
- [ ] Upsert video metadata
- [ ] Insert/update transcript
- [ ] Replace transcript segments atomically
- [ ] Mark processing status
- [ ] Make imports idempotent
- [ ] Ensure a crash cannot leave a transcript partially imported
- [ ] Add CLI commands for discover, download one, download all missing, retry failed, import / sync

## Phase 5 — Initial full archive

- [ ] Run discovery for the target channel
- [ ] Measure total number of videos
- [ ] Download transcripts gradually
- [ ] Track successful / unavailable / failed videos
- [ ] Retry failures
- [ ] Produce a final ingestion report

The archive should not be considered complete until every video is classified as one of:
- transcript imported
- transcript unavailable
- permanently failed after retries

## Phase 6 — PostgreSQL full-text search

Initial search must not use AI.

- [ ] Add a PostgreSQL tsvector search document
- [ ] Search title + transcript text
- [ ] Add a GIN index
- [ ] Rank results using PostgreSQL text-search ranking
- [ ] Return video title, matching text/snippet, video URL, and timestamp when the match belongs to a transcript segment
- [ ] Support pagination
- [ ] Add basic filters: date, language, video

Example user query:

Claude Code

Expected result:
- matching videos
- relevant transcript excerpts
- timestamp
- link to YouTube at that timestamp

## Phase 7 — Web interface on Vercel

After the data pipeline is reliable:

- [ ] Create a minimal search UI
- [ ] Search box
- [ ] Results list
- [ ] Result snippet
- [ ] Video title/date
- [ ] Timestamp link
- [ ] Pagination
- [ ] Empty/error states

Keep the UI intentionally simple until the ingestion and search quality are proven.

## Phase 8 — Automatic synchronization

After the initial archive works:

- [ ] Add scheduled GitHub Action
- [ ] Discover new videos periodically
- [ ] Process only videos not already in Neon
- [ ] Retry previously failed videos
- [ ] Produce an Action summary
- [ ] Avoid unnecessary requests to YouTube

## Phase 9 — Reliability / observability

- [ ] Structured logs
- [ ] Per-video processing status
- [ ] Retry counters
- [ ] Last successful sync timestamp
- [ ] Failure report
- [ ] Safe restart after interruption
- [ ] Database constraints preventing duplicate data

## Explicitly out of scope for MVP

Do NOT implement yet:
- embeddings
- pgvector
- semantic search
- LLM answers
- RAG
- AI summaries
- automatic topic extraction
- AI-generated tags

These can be added later on top of the same transcript/chunk data.

## Future AI phase

When the basic search is stable:

YouTube → transcripts → chunks → embeddings → pgvector → semantic retrieval → LLM/RAG

The current schema should make this possible without changing the ingestion architecture.

## Definition of MVP done

The MVP is complete when:

1. The complete target channel has been discovered.
2. Every discovered video has a clear processing status.
3. Available transcripts are stored in Neon.
4. Transcript segments retain timestamps.
5. Re-running ingestion does not duplicate data.
6. Failed videos can be retried.
7. PostgreSQL full-text search returns useful results.
8. Search results link directly to the relevant YouTube timestamp.
9. A scheduled sync can add future videos.
10. The entire system can be run from a clean checkout using documented environment variables.

## Implementation order

1. Project foundation
2. Video discovery
3. Single-video transcript download
4. Neon schema/migrations
5. Single-video import
6. Resumable bulk ingestion
7. Full archive
8. PostgreSQL search
9. Vercel UI
10. Scheduled synchronization
11. Reliability improvements
12. AI/semantic search — future phase
