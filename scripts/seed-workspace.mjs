import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const recoveryPath = path.join(projectRoot, "src/data/generated/wordpress-recovery.json");
const workspacePath = path.join(projectRoot, "src/data/workspace/editorial-workspace.json");

const recovery = JSON.parse(fs.readFileSync(recoveryPath, "utf8"));

const entries = [...recovery.allPages, ...recovery.allPosts]
  .map((record) => ({
    id: `${record.id}:${record.status}:${record.slug || "untitled"}`,
    sourceId: record.id,
    kind: recovery.allPages.some((page) => page.id === record.id) ? "page" : "post",
    title: record.title,
    slug: record.slug,
    originalStatus: record.status,
    workflowStatus: record.status === "publish" ? "published" : "draft",
    excerpt: record.excerpt,
    body: record.content,
    publicUrl: record.url,
    termLabels: record.terms.map((term) => `${term.taxonomy}: ${term.name}`),
    linkedAttachmentIds: record.linkedAttachmentIds,
    notes: "",
    updatedAt: new Date().toISOString(),
  }))
  .sort((a, b) => a.title.localeCompare(b.title));

const workspace = {
  generatedAt: new Date().toISOString(),
  sourceSnapshotGeneratedAt: recovery.generatedAt,
  entries,
};

fs.writeFileSync(workspacePath, `${JSON.stringify(workspace, null, 2)}\n`);

console.log(`Wrote workspace seed to ${workspacePath}`);
console.log(`Seeded ${entries.length} editable entries.`);
