import { readWorkspace, type WorkspaceEntry } from "@/lib/server/workspace-store";

const excludedPageSlugs = new Set(["cart", "checkout", "my-account", "shop", "wishlist"]);

function sortEntriesNewestFirst(entries: WorkspaceEntry[]) {
  return [...entries].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getPublishedPosts() {
  const workspace = await readWorkspace();
  return sortEntriesNewestFirst(
    workspace.entries.filter((entry) => entry.kind === "post" && entry.workflowStatus === "published" && entry.slug),
  );
}

export async function getPublishedPages() {
  const workspace = await readWorkspace();
  return workspace.entries
    .filter(
      (entry) =>
        entry.kind === "page" &&
        entry.workflowStatus === "published" &&
        entry.slug &&
        !excludedPageSlugs.has(entry.slug),
    )
    .sort((left, right) => left.title.localeCompare(right.title));
}

export async function getFeaturedEntries() {
  const [pages, posts] = await Promise.all([getPublishedPages(), getPublishedPosts()]);

  return {
    pages,
    posts,
    featuredPages: pages.filter((entry) => ["home", "bio", "works", "text", "cv", "contact"].includes(entry.slug)),
    featuredPosts: posts.slice(0, 6),
  };
}

export async function getPublicEntry(kind: "page" | "post", slug: string) {
  const workspace = await readWorkspace();
  return (
    workspace.entries.find(
      (entry) =>
        entry.kind === kind &&
        entry.slug === slug &&
        entry.workflowStatus === "published" &&
        (kind !== "page" || !excludedPageSlugs.has(entry.slug)),
    ) ?? null
  );
}
