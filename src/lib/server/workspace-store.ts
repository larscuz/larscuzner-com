"use server";

import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { redirect } from "next/navigation";
import {
  type EditorDocument,
  createMediaBlock,
  createEditorDocumentFromBody,
  deriveExcerptFromDocument,
  normalizeEditorDocument,
  renderDocumentToLegacyHtml,
} from "@/lib/editor-schema";
import { promotePrimaryMedia } from "@/lib/media-inference";
import { isAdminAuthenticated } from "@/lib/server/auth";
import { isPostgresProvider, withPostgresClient } from "@/lib/server/postgres";

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
const provider = process.env.CMS_STORE_PROVIDER === "mysql" ? "mysql" : isPostgresProvider() ? "postgres" : "file";

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

async function ensurePostgresSchema() {
  await withPostgresClient(async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS cms_workspace_entries (
        id TEXT PRIMARY KEY,
        source_id BIGINT NOT NULL,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        slug TEXT NOT NULL,
        original_status TEXT NOT NULL,
        workflow_status TEXT NOT NULL,
        excerpt TEXT NOT NULL,
        body TEXT NOT NULL,
        public_url TEXT NOT NULL,
        term_labels JSONB NOT NULL,
        linked_attachment_ids JSONB NOT NULL,
        notes TEXT NOT NULL,
        editor_document JSONB NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
  });
}

async function readPostgresWorkspace(): Promise<WorkspaceFile> {
  await ensurePostgresSchema();

  return withPostgresClient(async (client) => {
    let result = await client.query(
      `SELECT id, source_id, kind, title, slug, original_status, workflow_status, excerpt, body, public_url, term_labels, linked_attachment_ids, notes, editor_document, updated_at
       FROM cms_workspace_entries
       ORDER BY title ASC`,
    );

    if (result.rows.length === 0) {
      const fileWorkspace = await readFileWorkspace();

      for (const entry of fileWorkspace.entries) {
        await client.query(
          `INSERT INTO cms_workspace_entries
          (id, source_id, kind, title, slug, original_status, workflow_status, excerpt, body, public_url, term_labels, linked_attachment_ids, notes, editor_document, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13, $14::jsonb, $15)
          ON CONFLICT (id) DO NOTHING`,
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
            entry.updatedAt,
          ],
        );
      }

      result = await client.query(
        `SELECT id, source_id, kind, title, slug, original_status, workflow_status, excerpt, body, public_url, term_labels, linked_attachment_ids, notes, editor_document, updated_at
         FROM cms_workspace_entries
         ORDER BY title ASC`,
      );
    }

    return {
      generatedAt: new Date().toISOString(),
      sourceSnapshotGeneratedAt: null,
      entries: result.rows.map((row) =>
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
          termLabels: Array.isArray(row.term_labels) ? row.term_labels : [],
          linkedAttachmentIds: Array.isArray(row.linked_attachment_ids) ? row.linked_attachment_ids.map(Number) : [],
          notes: String(row.notes),
          editorDocument: row.editor_document ?? createEditorDocumentFromBody(String(row.body)),
          updatedAt: new Date(row.updated_at).toISOString(),
        }),
      ),
    };
  });
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

async function writePostgresEntry(entry: WorkspaceEntry) {
  await ensurePostgresSchema();

  await withPostgresClient(async (client) => {
    await client.query(
      `INSERT INTO cms_workspace_entries
      (id, source_id, kind, title, slug, original_status, workflow_status, excerpt, body, public_url, term_labels, linked_attachment_ids, notes, editor_document, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13, $14::jsonb, $15)
      ON CONFLICT (id) DO UPDATE SET
        source_id = EXCLUDED.source_id,
        kind = EXCLUDED.kind,
        title = EXCLUDED.title,
        slug = EXCLUDED.slug,
        original_status = EXCLUDED.original_status,
        workflow_status = EXCLUDED.workflow_status,
        excerpt = EXCLUDED.excerpt,
        body = EXCLUDED.body,
        public_url = EXCLUDED.public_url,
        term_labels = EXCLUDED.term_labels,
        linked_attachment_ids = EXCLUDED.linked_attachment_ids,
        notes = EXCLUDED.notes,
        editor_document = EXCLUDED.editor_document,
        updated_at = EXCLUDED.updated_at`,
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
        entry.updatedAt,
      ],
    );
  });
}

async function persistWorkspaceEntry(workspace: WorkspaceFile, entry: WorkspaceEntry) {
  if (provider === "mysql") {
    await writeMysqlEntry(entry);
  } else if (provider === "postgres") {
    await writePostgresEntry(entry);
  } else {
    await writeFileWorkspace(workspace);
  }
}

function findWorkspaceEntryInFile(workspace: WorkspaceFile, id: string) {
  const numericId = Number(id);

  return (
    workspace.entries.find(
      (entry) => entry.id === id || (Number.isFinite(numericId) && entry.sourceId === numericId),
    ) ?? null
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "untitled";
}

export async function readWorkspace(): Promise<WorkspaceFile> {
  if (provider === "mysql") {
    return readMysqlWorkspace();
  }

  if (provider === "postgres") {
    return readPostgresWorkspace();
  }

  return readFileWorkspace();
}

export async function getWorkspaceEntry(id: string) {
  const workspace = await readWorkspace();
  return findWorkspaceEntryInFile(workspace, id);
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
  const entry = findWorkspaceEntryInFile(workspace, id);

  if (!entry) {
    throw new Error(`Workspace entry not found: ${id}`);
  }

  entry.title = String(formData.get("title") || "").trim();
  entry.slug = String(formData.get("slug") || "").trim();
  entry.workflowStatus = String(formData.get("workflowStatus") || "draft") as WorkspaceEntry["workflowStatus"];
  entry.notes = String(formData.get("notes") || "");
  entry.updatedAt = new Date().toISOString();

  const editorDocumentRaw = String(formData.get("editorDocument") || "");
  entry.editorDocument = promotePrimaryMedia(
    normalizeEditorDocument(editorDocumentRaw ? JSON.parse(editorDocumentRaw) : entry.editorDocument, entry.body),
  );
  entry.body = renderDocumentToLegacyHtml(entry.editorDocument);
  entry.excerpt = deriveExcerptFromDocument(entry.editorDocument);

  await persistWorkspaceEntry(workspace, entry);

  redirect(`/admin/entry/${entry.sourceId}?saved=1`);
}

export async function saveWorkspaceEntryFromFrontend(payload: {
  id: string;
  title: string;
  slug?: string;
  editorDocument: EditorDocument;
}) {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }

  const workspace = await readWorkspace();
  const entry = findWorkspaceEntryInFile(workspace, payload.id);

  if (!entry) {
    throw new Error(`Workspace entry not found: ${payload.id}`);
  }

  entry.title = payload.title.trim() || entry.title;
  entry.slug = (payload.slug || entry.slug).trim();
  entry.editorDocument = promotePrimaryMedia(normalizeEditorDocument(payload.editorDocument, entry.body));
  entry.body = renderDocumentToLegacyHtml(entry.editorDocument);
  entry.excerpt = deriveExcerptFromDocument(entry.editorDocument);
  entry.updatedAt = new Date().toISOString();

  await persistWorkspaceEntry(workspace, entry);

  return {
    ok: true,
    sourceId: entry.sourceId,
    slug: entry.slug,
    updatedAt: entry.updatedAt,
  };
}

export async function createWorkspaceEntry(kind: "page" | "post") {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }

  const workspace = await readWorkspace();
  const nextSourceId = workspace.entries.reduce((max, entry) => Math.max(max, entry.sourceId), 0) + 1;
  const baseTitle = kind === "page" ? "New Page" : "New Post";
  const baseSlug = slugify(`${kind}-${nextSourceId}`);
  const createdAt = new Date().toISOString();
  const starterText = "<p>Start writing here.</p>";
  const editorDocument =
    kind === "post"
      ? {
          version: 1 as const,
          theme: "terminal" as const,
          blocks: [
            createMediaBlock({
              title: "Featured media placeholder",
              caption: "Assign the first image or video for this post here.",
              alt: "Featured media placeholder",
              emphasis: "feature",
            }),
            ...createEditorDocumentFromBody(starterText).blocks,
          ],
        }
      : createEditorDocumentFromBody(starterText);

  const entry: WorkspaceEntry = {
    id: `${nextSourceId}:draft:${baseSlug}`,
    sourceId: nextSourceId,
    kind,
    title: baseTitle,
    slug: baseSlug,
    originalStatus: "draft",
    workflowStatus: "draft",
    excerpt: "",
    body: starterText,
    publicUrl: `/site/${kind}/${baseSlug}`,
    termLabels: [],
    linkedAttachmentIds: [],
    notes: "",
    updatedAt: createdAt,
    editorDocument,
  };

  workspace.entries.push(entry);
  await persistWorkspaceEntry(workspace, entry);

  redirect(`/admin/entry/${entry.sourceId}`);
}
