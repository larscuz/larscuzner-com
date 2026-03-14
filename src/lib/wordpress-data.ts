import rawSnapshot from "@/data/generated/wordpress-recovery.json";

export type SiteSettings = {
  siteUrl: string;
  homeUrl: string;
  permalinkStructure: string;
  showOnFront: string;
  pageOnFront: number | null;
  pageForPosts: number | null;
  template: string;
  stylesheet: string;
  activePlugins: string[];
};

export type TaxonomyTerm = {
  id: number;
  taxonomy: string;
  slug: string;
  name: string;
  count?: number;
};

export type ContentRecord = {
  id: number;
  title: string;
  slug: string;
  date: string;
  status: string;
  excerpt: string;
  content: string;
  url: string;
  terms: TaxonomyTerm[];
  linkedAttachmentIds: number[];
};

export type AttachmentLink = {
  id: number;
  kind: "posts" | "pages";
  title: string;
  slug: string;
};

export type AttachmentRecord = {
  id: number;
  title: string;
  slug: string;
  url: string;
  file: string;
  mimeType: string;
  linkedFrom: AttachmentLink[];
};

export type MenuRecord = {
  id: number;
  name: string;
  slug: string;
};

export type MenuItemRecord = {
  id: number;
  menuId: number | null;
  label: string;
  slug: string;
  parentId: number | null;
  objectId: number | null;
  objectType: string;
  type: string;
  position: number;
  url: string;
};

export type RecoverySnapshot = {
  generatedAt: string | null;
  sources: {
    sqlPath: string;
    xmlPath: string;
  };
  rootSite: SiteSettings;
  blogSite: SiteSettings;
  xmlSummary: {
    title: string;
    baseSiteUrl: string;
    generator: string;
    postTypeCounts: Record<string, number>;
  };
  menus: MenuRecord[];
  menuItems: MenuItemRecord[];
  taxonomies: TaxonomyTerm[];
  posts: ContentRecord[];
  pages: ContentRecord[];
  allPosts: ContentRecord[];
  allPages: ContentRecord[];
  attachments: AttachmentRecord[];
  legacyBlog: {
    posts: number;
    pages: number;
  };
  signals: {
    usesVisualComposerShortcodes: boolean;
    usesElementorTaxonomy: boolean;
    usesWooCommerceTaxonomies: boolean;
  };
};

const snapshot = rawSnapshot as RecoverySnapshot;

export function getRecoverySnapshot(): RecoverySnapshot {
  return snapshot;
}

export function formatDate(value: string | null) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function compactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function getContentCollection(kind: string) {
  if (kind === "posts") {
    return snapshot.posts;
  }

  if (kind === "pages") {
    return snapshot.pages;
  }

  if (kind === "attachments") {
    return snapshot.attachments;
  }

  return [];
}

export function getContentRecord(kind: string, id: string) {
  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    return null;
  }

  return getContentCollection(kind).find((record) => record.id === numericId) ?? null;
}

export function getMenuTree(menuId: number) {
  const items = snapshot.menuItems.filter((item) => item.menuId === menuId);
  const byParent = new Map<number | null, MenuItemRecord[]>();

  for (const item of items) {
    const key = item.parentId ?? null;
    const group = byParent.get(key) ?? [];
    group.push(item);
    byParent.set(key, group);
  }

  const sortItems = (entries: MenuItemRecord[]) =>
    [...entries].sort((left, right) => {
      if (left.position !== right.position) {
        return left.position - right.position;
      }

      return left.label.localeCompare(right.label);
    });

  type MenuBranch = MenuItemRecord & { children: MenuBranch[] };

  const buildBranch = (parentId: number | null): MenuBranch[] =>
    sortItems(byParent.get(parentId) ?? []).map((item) => ({
      ...item,
      children: buildBranch(item.id),
    }));

  return buildBranch(null);
}
