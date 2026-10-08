import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  DATABASE_URL_UNPOOLED: z.string().optional(),
  YOUTUBE_CHANNEL_ID: z.string().default("UCl0p-aoACzTOgnCctzIQWPQ"),
  YOUTUBE_LANGUAGES: z.string().default("en,ru")
});

export const env = envSchema.parse(process.env);

export const transcriptLanguages = env.YOUTUBE_LANGUAGES
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export function requireDatabaseUrl(): string {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for database commands.");
  }
  return env.DATABASE_URL;
}
