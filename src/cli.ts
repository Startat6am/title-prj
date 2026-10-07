const command = process.argv[2] ?? "help";

const help = [
  "YouTube Transcript Knowledge Base",
  "",
  "Commands:",
  "  help              Show this help",
  "  db:ping           Verify the Neon connection",
  "  transcript:one    Fetch one video transcript (coming next)",
  "  discover          Discover channel videos (coming next)",
  "  ingest            Import missing transcripts (coming next)",
  "  search            Search transcripts (coming next)"
].join("\n");

if (command === "help") {
  console.log(help);
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