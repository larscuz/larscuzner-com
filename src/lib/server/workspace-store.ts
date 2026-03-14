"use server";

import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { redirect } from "next/navigation";

export type WorkspaceEntry = {
  id: string;
  sourceId: number;
  kind: "page" | "post";
  title: string;
  slug: string;
  originalStatus: string;
  workflowStatus: "published" | "draft" | "review";
  excerpt: string;
  body: string;
  publicUrl: string;
  termLabels: string[];
  linkedAttachmentIds: number[];
  notes: string;
  updatedAt: string;
};

export type WorkspaceFile = {
  generatedAt: string | null;
  sourceSnapshotGeneratedAt: string | null;
  entries: WorkspaceEntry[];
};

const workspacePath = path.join(process.cwd(), "src/data/workspace/editorial-workspace.json");
const provider = process.env.CMS_STORE_PROVIDER === "mysql" ? "mysql" : "file";

function getMysqlConfig() {
  const host = process.env.CMS_MYSQL_HOST;
  const user = process.env.CMS_MYSQL_USER;
  const password = process.env.CMS_MYSQL_PASSWORD;
  const database = process.env.CMS_MYSQL_DATABASE;

  if (!host || !user || !database) {
    throw new Error("Missing CMS_MYSQL_HOST, CMS_MYSQL_USER, or CMS_MYSQL_DATABASE for mysql provider.");
  }

  return {
    host,
    user,
    password,
    database,
    port: process.env.CMS_MYSQL_PORT ? Number(process.env.CMS_MYSQL_PORT) : 3306,
  };
}

async function readFileWorkspace(): Promise<WorkspaceFile> {
  const raw = await fs.readFile(workspacePath, "utf8");
  return JSON.parse(raw) as WorkspaceFile;
}

async function writeFileWorkspace(workspace: WorkspaceFile) {
  await fs.writeFile(workspacePath, `${JSON.stringify(workspace, null, 2)}\n`);
}

async function ensureMysqlSchema(connection: mysql.Connection) {
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
}

async function getMysqlConnection() {
  return mysql.createConnection(getMysqlConfig());
}

async function readMysqlWorkspace(): Promise<WorkspaceFile> {
  const connection = await getMysqlConnection();

  try {
    await ensureMysqlSchema(connection);
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT id, source_id, kind, title, slug, original_status, workflow_status, excerpt, body, public_url, term_labels, linked_attachment_ids, notes, updated_at
       FROM cms_workspace_entries
       ORDER BY title ASC`,
    );

    return {
      generatedAt: new Date().toISOString(),
      sourceSnapshotGeneratedAt: null,
      entries: rows.map((row) => ({
        id: String(row.id),
        sourceId: Number(row.source_id),
        kind: row.kind as "page" | "post",
        title: String(row.title),
        slug: String(row.slug),
        originalStatus: String(row.original_status),
        workflowStatus: row.workflow_status as WorkspaceEntry["workflowStatus"],
        excerpt: String(row.excerpt),
        body: String(row.body),
        publicUrl: String(row.public_url),
        termLabels: JSON.parse(String(row.term_labels)),
        linkedAttachmentIds: JSON.parse(String(row.linked_attachment_ids)),
        notes: String(row.notes),
        updatedAt: new Date(row.updated_at).toISOString(),
      })),
    };
  } finally {
    await connection.end();
  }
}

async function writeMysqlEntry(entry: WorkspaceEntry) {
  const connection = await getMysqlConnection();

  try {
    await ensureMysqlSchema(connection);
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
        entry.updatedAt.slice(0, 19).replace("T", " "),
      ],
    );
  } finally {
    await connection.end();
  }
}

export async function readWorkspace(): Promise<WorkspaceFile> {
  if (provider === "mysql") {
    return readMysqlWorkspace();
  }

  return readFileWorkspace();
}

export async function getWorkspaceEntry(id: string) {
  const workspace = await readWorkspace();
  return workspace.entries.find((entry) => entry.id === id) ?? null;
}

export async function updateWorkspaceEntry(formData: FormData) {
  const id = String(formData.get("id") || "");
  const workspace = await readWorkspace();
  const entry = workspace.entries.find((item) => item.id === id);

  if (!entry) {
    throw new Error(`Workspace entry not found: ${id}`);
  }

  entry.title = String(formData.get("title") || "").trim();
  entry.slug = String(formData.get("slug") || "").trim();
  entry.workflowStatus = String(formData.get("workflowStatus") || "draft") as WorkspaceEntry["workflowStatus"];
  entry.excerpt = String(formData.get("excerpt") || "");
  entry.body = String(formData.get("body") || "");
  entry.notes = String(formData.get("notes") || "");
  entry.updatedAt = new Date().toISOString();

  if (provider === "mysql") {
    await writeMysqlEntry(entry);
  } else {
    await writeFileWorkspace(workspace);
  }

  redirect(`/admin/entry/${encodeURIComponent(id)}?saved=1`);
}
