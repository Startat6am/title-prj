import { getTranscript } from "get-youtube-transcript";
import { env } from "./config.js";

export async function fetchVideoTranscript(youtubeId: string) {
  const id = youtubeId.trim();
  if (!id) throw new Error("YouTube video ID is required.");

  const transcript = await getTranscript(id, {
    languages: env.YOUTUBE_LANGUAGES
  });

  return transcript;
}
