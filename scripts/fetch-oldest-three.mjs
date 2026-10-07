import { Innertube } from "youtubei.js";
import { getTranscript } from "get-youtube-transcript";
import { writeFile } from "node:fs/promises";

const channelId = "UCl0p-aoACzTOgnCctzIQWPQ";
const languages = ["en", "ru"];

const youtube = await Innertube.create();
let feed = await (await youtube.getChannel(channelId)).getVideos();
const seen = new Set();
const oldest = [];

while (true) {
  for (const item of feed.videos ?? []) {
    const video = item;
    const id = String(video.video_id ?? video.id ?? "");
    if (!id || seen.has(id)) continue;
    seen.add(id);

    oldest.push({
      youtubeId: id,
      title: typeof video.title === "string" ? video.title : (video.title?.text ?? id),
      publishedText: video.published?.text ?? null,
    });
    if (oldest.length > 3) oldest.shift();
  }

  if (!feed.has_continuation) break;
  feed = await feed.getContinuation();
}

if (oldest.length < 3) {
  throw new Error(`Expected at least 3 videos, found ${oldest.length}`);
}

const results = [];
for (const video of oldest) {
  console.log(`Fetching transcript: ${video.youtubeId} — ${video.title}`);
  try {
    const transcript = await getTranscript(video.youtubeId, { languages });
    results.push({
      ...video,
      youtubeUrl: `https://www.youtube.com/watch?v=${video.youtubeId}`,
      transcript,
      status: "completed",
    });
  } catch (error) {
    results.push({
      ...video,
      youtubeUrl: `https://www.youtube.com/watch?v=${video.youtubeId}`,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

await writeFile("oldest-three-transcripts.json", JSON.stringify(results, null, 2), "utf8");
console.log(JSON.stringify(results.map(({youtubeId,title,publishedText,status,error}) => ({youtubeId,title,publishedText,status,error})), null, 2));
