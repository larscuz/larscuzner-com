"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { isAdminAuthenticated } from "@/lib/server/auth";
import {
  createDefaultHomePageDocument,
  normalizeHomePageDocument,
  type HomePageDocument,
} from "@/lib/site-page-schema";
import {
  createDefaultIntelligencePartyDocument,
  normalizeIntelligencePartyDocument,
  type IntelligencePartyDocument,
} from "@/lib/project-room-schema";
import { isPostgresProvider, withPostgresClient } from "@/lib/server/postgres";

const documentsPath = path.join(process.cwd(), "src/data/workspace/site-documents.json");

type SiteDocumentsFile = {
  homepage?: unknown;
  intelligenceParty?: unknown;
};

async function readDocumentsFile() {
  const raw = await fs.readFile(documentsPath, "utf8");
  return JSON.parse(raw) as SiteDocumentsFile;
}

async function writeDocumentsFile(file: SiteDocumentsFile) {
  await fs.writeFile(documentsPath, `${JSON.stringify(file, null, 2)}\n`);
}

async function ensureSiteDocumentsSchema() {
  await withPostgresClient(async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS cms_site_documents (
        id TEXT PRIMARY KEY,
        document JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  });
}

export async function readHomepageDocument(): Promise<HomePageDocument> {
  if (isPostgresProvider()) {
    await ensureSiteDocumentsSchema();

    return withPostgresClient(async (client) => {
      const result = await client.query(`SELECT document FROM cms_site_documents WHERE id = $1 LIMIT 1`, ["homepage"]);

      if (result.rows[0]) {
        return normalizeHomePageDocument(result.rows[0].document);
      }

      const file = await readDocumentsFile().catch(() => ({} as SiteDocumentsFile));
      const homepage = normalizeHomePageDocument(file.homepage);

      await client.query(
        `INSERT INTO cms_site_documents (id, document, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET document = EXCLUDED.document, updated_at = NOW()`,
        ["homepage", JSON.stringify(homepage)],
      );

      return homepage;
    });
  }

  try {
    const file = await readDocumentsFile();
    return normalizeHomePageDocument(file.homepage);
  } catch {
    return createDefaultHomePageDocument();
  }
}

export async function saveHomepageDocument(payload: { homepage: HomePageDocument }) {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }

  const homepage = normalizeHomePageDocument(payload.homepage);

  if (isPostgresProvider()) {
    await ensureSiteDocumentsSchema();
    await withPostgresClient(async (client) => {
      await client.query(
        `INSERT INTO cms_site_documents (id, document, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET document = EXCLUDED.document, updated_at = NOW()`,
        ["homepage", JSON.stringify(homepage)],
      );
    });
  } else {
    const file = await readDocumentsFile().catch(() => ({} as SiteDocumentsFile));
    await writeDocumentsFile({
      ...file,
      homepage,
    });
  }

  return {
    ok: true,
  };
}

export async function readIntelligencePartyDocument(): Promise<IntelligencePartyDocument> {
  if (isPostgresProvider()) {
    await ensureSiteDocumentsSchema();

    return withPostgresClient(async (client) => {
      const result = await client.query(`SELECT document FROM cms_site_documents WHERE id = $1 LIMIT 1`, ["intelligence-party"]);

      if (result.rows[0]) {
        return normalizeIntelligencePartyDocument(result.rows[0].document);
      }

      const file = await readDocumentsFile().catch(() => ({} as SiteDocumentsFile));
      const document = normalizeIntelligencePartyDocument(file.intelligenceParty);

      await client.query(
        `INSERT INTO cms_site_documents (id, document, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET document = EXCLUDED.document, updated_at = NOW()`,
        ["intelligence-party", JSON.stringify(document)],
      );

      return document;
    });
  }

  try {
    const file = await readDocumentsFile();
    return normalizeIntelligencePartyDocument(file.intelligenceParty);
  } catch {
    return createDefaultIntelligencePartyDocument();
  }
}

export async function saveIntelligencePartyDocument(payload: { document: IntelligencePartyDocument }) {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }

  const document = normalizeIntelligencePartyDocument(payload.document);

  if (isPostgresProvider()) {
    await ensureSiteDocumentsSchema();
    await withPostgresClient(async (client) => {
      await client.query(
        `INSERT INTO cms_site_documents (id, document, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET document = EXCLUDED.document, updated_at = NOW()`,
        ["intelligence-party", JSON.stringify(document)],
      );
    });
  } else {
    const file = await readDocumentsFile().catch(() => ({} as SiteDocumentsFile));
    await writeDocumentsFile({
      ...file,
      intelligenceParty: document,
    });
  }

  return {
    ok: true,
  };
}
