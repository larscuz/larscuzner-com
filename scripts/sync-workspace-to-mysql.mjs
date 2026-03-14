import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const workspacePath = path.join(projectRoot, "src/data/workspace/editorial-workspace.json");

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }

  return value;
}

async function main() {
  const workspace = JSON.parse(fs.readFileSync(workspacePath, "utf8"));
  const connection = await mysql.createConnection({
    host: requireEnv("CMS_MYSQL_HOST"),
    user: requireEnv("CMS_MYSQL_USER"),
    password: process.env.CMS_MYSQL_PASSWORD || "",
    database: requireEnv("CMS_MYSQL_DATABASE"),
    port: process.env.CMS_MYSQL_PORT ? Number(process.env.CMS_MYSQL_PORT) : 3306,
  });

  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cms_workspace_entries (
        id VARCHAR(191) PRIMARY KEY,
        source_id BIGINT NOT NULL,
        kind VARCHAR(32) NOT NULL,
        title TEXT NOT NULL,
        slug TEXT NOT NULL,
        original_status VARCHAR(32) NOT NULL,
        workflow_status VARCHAR(32) NOT NULL,
        excerpt LONGTEXT NOT NULL,
        body LONGTEXT NOT NULL,
        public_url TEXT NOT NULL,
        term_labels JSON NOT NULL,
        linked_attachment_ids JSON NOT NULL,
        notes LONGTEXT NOT NULL,
        updated_at DATETIME NOT NULL
      )
    `);

    for (const entry of workspace.entries) {
      await connection.execute(
        `REPLACE INTO cms_workspace_entries
        (id, source_id, kind, title, slug, original_status, workflow_status, excerpt, body, public_url, term_labels, linked_attachment_ids, notes, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.id,
          entry.sourceId,
          entry.kind,
          entry.title,
          entry.slug,
          entry.originalStatus,
          entry.workflowStatus,
          entry.excerpt,
          entry.body,
          entry.publicUrl,
          JSON.stringify(entry.termLabels),
          JSON.stringify(entry.linkedAttachmentIds),
          entry.notes,
          String(entry.updatedAt).slice(0, 19).replace("T", " "),
        ],
      );
    }

    console.log(`Synced ${workspace.entries.length} entries to MySQL.`);
  } finally {
    await connection.end();
  }
}

main();
