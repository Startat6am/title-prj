import { Innertube } from "youtubei.js";
import { env } from "./config.js";
import { sql } from "./db.js";

export type DiscoveredVideo = {
  youtubeId: string;
  title: string;
  description: string | null;
  durationSeconds: number | null;
};

function textValue(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "text" in value) {
    return String((value as { text?: unknown }).text ?? "");
  }
  return String(value);
}

async function saveVideo(video: DiscoveredVideo): Promise<void> {
  await sql`
    insert into videos (
      youtube_id,
      title,
      description,
      youtube_url,
      duration_seconds
    )
    values (
      ${video.youtubeId},
      ${video.title || video.youtubeId},
      ${video.description},
      ${"https://www.youtube.com/watch?v=" + video.youtubeId},
      ${video.durationSeconds}
    )
    on conflict (youtube_id) do update set
      title = excluded.title,
      description = excluded.description,
      duration_seconds = excluded.duration_seconds,
      updated_at = now()
  `;
}

export async function discoverChannelVideos(): Promise<number> {
  const youtube = await Innertube.create();
  let feed = await youtube.getChannel(env.YOUTUBE_CHANNEL_ID);
  feed = await feed.getVideos();

  const seen = new Set<string>();
  let total = 0;

  while (true) {
    for (const item of feed.videos ?? []) {
      const video = item as any;
      const youtubeId = String(video.video_id ?? video.id ?? "");
      if (!youtubeId || seen.has(youtubeId)) continue;

      seen.add(youtubeId);
      const title = textValue(video.title);
      const description =
        typeof video.description === "string"
          ? video.description
          : video.description_snippet
            ? textValue(video.description_snippet)
            : null;
      const durationSeconds =
        typeof video.duration?.seconds === "number"
          ? video.duration.seconds
          : null;

      await saveVideo({
        youtubeId,
        title,
        description,
        durationSeconds
      });

      total += 1;
      console.log(total + ": " + youtubeId + " — " + (title || "(untitled)"));
    }

    if (!feed.has_continuation) break;
    feed = await feed.getContinuation();
  }

  return total;
}