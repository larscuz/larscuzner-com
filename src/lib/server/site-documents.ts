"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { isAdminAuthenticated } from "@/lib/server/auth";
import {
  createDefaultHomePageDocument,
  normalizeHomePageDocument,
  type HomePageDocument,
} from "@/lib/site-page-schema";

const documentsPath = path.join(process.cwd(), "src/data/workspace/site-documents.json");

type SiteDocumentsFile = {
  homepage?: unknown;
};

async function readDocumentsFile() {
  const raw = await fs.readFile(documentsPath, "utf8");
  return JSON.parse(raw) as SiteDocumentsFile;
}

async function writeDocumentsFile(file: SiteDocumentsFile) {
  await fs.writeFile(documentsPath, `${JSON.stringify(file, null, 2)}\n`);
}

export async function readHomepageDocument(): Promise<HomePageDocument> {
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

  const file = await readDocumentsFile().catch(() => ({}));
  const homepage = normalizeHomePageDocument(payload.homepage);
  await writeDocumentsFile({
    ...file,
    homepage,
  });

  return {
    ok: true,
  };
}
