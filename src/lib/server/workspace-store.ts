"use server";

import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { redirect } from "next/navigation";
import {
  type EditorDocument,
  createEditorDocumentFromBody,
  deriveExcerptFromDocument,
  normalizeEditorDocument,
  renderDocumentToLegacyHtml,
} from "@/lib/editor-schema";

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
  editorDocument: EditorDocument;
};

export type WorkspaceFile = {
  generatedAt: string | null;
  sourceSnapshotGeneratedAt: string | null;
  entries: WorkspaceEntry[];
};

type RawWorkspaceEntry = Omit<WorkspaceEntry, "editorDocument"> & {
  editorDocument?: unknown;
};

const workspacePath = path.join(process.cwd(), "src/data/workspace/editorial-workspace.json");
const provider = process.env.CMS_STORE_PROVIDER === "mysql" ? "mysql" : "file";

function normalizeWorkspaceEntry(entry: RawWorkspaceEntry): WorkspaceEntry {
  return {
    ...entry,
    editorDocument: normalizeEditorDocument(entry.editorDocument, entry.body),
  };
}

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
  const workspace = JSON.parse(raw) as { generatedAt: string | null; sourceSnapshotGeneratedAt: string | null; entries: RawWorkspaceEntry[] };

  return {
    ...workspace,
    entries: workspace.entries.map(normalizeWorkspaceEntry),
  };
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
      editor_document JSON NULL,
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
      `SELECT id, source_id, kind, title, slug, original_status, workflow_status, excerpt, body, public_url, term_labels, linked_attachment_ids, notes, editor_document, updated_at
       FROM cms_workspace_entries
       ORDER BY title ASC`,
    );

    return {
      generatedAt: new Date().toISOString(),
      sourceSnapshotGeneratedAt: null,
      entries: rows.map((row) =>
        normalizeWorkspaceEntry({
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
          editorDocument: row.editor_document ? JSON.parse(String(row.editor_document)) : createEditorDocumentFromBody(String(row.body)),
          updatedAt: new Date(row.updated_at).toISOString(),
        }),
      ),
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
      (id, source_id, kind, title, slug, original_status, workflow_status, excerpt, body, public_url, term_labels, linked_attachment_ids, notes, editor_document, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        JSON.stringify(entry.editorDocument),
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
  const numericId = Number(id);

  return (
    workspace.entries.find(
      (entry) => entry.id === id || (Number.isFinite(numericId) && entry.sourceId === numericId),
    ) ?? null
  );
}

export async function findWorkspaceEntryBySlug(kind: "page" | "post", slug: string) {
  const workspace = await readWorkspace();
  return (
    workspace.entries.find(
      (entry) => entry.kind === kind && entry.slug === slug && entry.workflowStatus === "published",
    ) ?? null
  );
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
  entry.notes = String(formData.get("notes") || "");
  entry.updatedAt = new Date().toISOString();

  const editorDocumentRaw = String(formData.get("editorDocument") || "");
  entry.editorDocument = normalizeEditorDocument(
    editorDocumentRaw ? JSON.parse(editorDocumentRaw) : entry.editorDocument,
    entry.body,
  );
  entry.body = renderDocumentToLegacyHtml(entry.editorDocument);
  entry.excerpt = deriveExcerptFromDocument(entry.editorDocument);

  if (provider === "mysql") {
    await writeMysqlEntry(entry);
  } else {
    await writeFileWorkspace(workspace);
  }

  redirect(`/admin/entry/${entry.sourceId}?saved=1`);
}
