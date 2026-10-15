import "dotenv/config";
import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false }, max: 1 });
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  console.log("pgvector extension is enabled");
  await sql.end();
}

main().catch((error) => {
  console.error("Failed to enable pgvector:", error);
  process.exit(1);
});
