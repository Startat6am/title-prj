const command = process.argv[2] ?? "help";

const help = [
  "YouTube Transcript Knowledge Base",
  "",
  "Commands:",
  "  help              Show this help",
  "  db:ping           Verify the Neon connection",
  "  transcript:one    Fetch one video transcript",
  "  discover          Discover channel videos",
  "  ingest            Import missing transcripts (coming next)",
  "  search            Search transcripts (coming next)"
].join("\n");

if (command === "help") {
  console.log(help);
  process.exit(0);
}

if (command === "transcript:one") {
  const youtubeId = process.argv[3];
  if (!youtubeId) {
    console.error("Usage: npm run dev -- transcript:one <youtube-id>");
    process.exit(1);
  }

  const { fetchVideoTranscript } = await import("./transcript.js");

  try {
    const transcript = await fetchVideoTranscript(youtubeId);
    console.log(JSON.stringify({
      youtubeId,
      language: transcript.language,
      text: transcript.text,
      segments: transcript.segments
    }, null, 2));
  } catch (error) {
    console.error(
      "Transcript failed:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
  process.exit(0);
}

if (command === "discover") {
  const { discoverChannelVideos } = await import("./discover.js");
  const total = await discoverChannelVideos();
  console.log("Discovered:", total);
  process.exit(0);
}

if (command === "db:ping") {
  const { sql } = await import("./db.js");
  const rows = await sql`select now() as now`;
  console.log("Neon OK:", rows[0]?.now ?? "unknown");
  process.exit(0);
}

console.error("Unknown command:", command);
process.exit(1);
