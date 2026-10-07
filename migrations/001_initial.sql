create table if not exists videos (
  id bigint generated always as identity primary key,
  youtube_id text not null unique,
  title text not null,
  description text,
  youtube_url text not null,
  published_at timestamptz,
  duration_seconds integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists transcripts (
  id bigint generated always as identity primary key,
  video_id bigint not null references videos(id) on delete cascade,
  language text not null,
  text text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'unavailable', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (video_id, language)
);

create table if not exists transcript_segments (
  id bigint generated always as identity primary key,
  transcript_id bigint not null references transcripts(id) on delete cascade,
  segment_index integer not null,
  start_seconds double precision not null,
  duration_seconds double precision not null,
  text text not null,
  unique (transcript_id, segment_index)
);

create index if not exists idx_videos_published_at on videos (published_at desc);
create index if not exists idx_transcripts_status on transcripts (status);
create index if not exists idx_segments_transcript_id on transcript_segments (transcript_id);