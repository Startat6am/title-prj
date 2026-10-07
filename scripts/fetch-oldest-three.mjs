import { Innertube } from "youtubei.js";
import { getTranscript } from "get-youtube-transcript";
import { writeFile } from "node:fs/promises";

const languages = ["en", "ru"];

const candidates = [
  {
    youtubeId: "VvfcEPN7wXE",
    title: "ВОТ КАК Я ЕМ МАНДАРИНЫ. ГОДНОЕ ПОЕДАНИЕ ЦИТРУСОВЫХ ФРУКТОВ. Ешьте как я и будете здоровы!",
    publishedText: "2023-01-04",
  },
  {
    youtubeId: "SbqSnd63reA",
    title: "МОЁ ПЕРВОЕ ВИДЕО НА YouTube. Чем лучше обеззараживать семена. Реальные опыты и рекомендации.",
    publishedText: "2023-01-19",
  },
];

const youtube = await Innertube.create();

async function findByTitle(query) {
  const result = await youtube.search(query, { type: "video" });
  for (const item of result.videos ?? []) {
    const video = item;
    const id = String(video.video_id ?? video.id ?? "");
    const title =
      typeof video.title === "string"
        ? video.title
        : String(video.title?.text ?? "");
    if (id && title.toLowerCase().includes("тест")) {
      return {
        youtubeId: id,
        title,
        publishedText: video.published?.text ?? "2023-01-04",
      };
    }
  }
  return null;
}

const testVideo = await findByTitle(
  "ТЕСТ! УМНЕЕ ЛИ ВЫ, ЧЕМ 9 МИЛЛИОНОВ ЛЮДЕЙ? Иванова Наука"
);
if (!testVideo) {
  throw new Error("Could not locate the 2023-01-04 test video.");
}

const oldest = [testVideo, candidates[0], candidates[1]];

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

await writeFile(
  "oldest-three-transcripts.json",
  JSON.stringify(results, null, 2),
  "utf8"
);

console.log(
  JSON.stringify(
    results.map(({ youtubeId, title, publishedText, status, error }) => ({
      youtubeId,
      title,
      publishedText,
      status,
      error,
    })),
    null,
    2
  )
);
