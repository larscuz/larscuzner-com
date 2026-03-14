import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const sourceRoot = path.resolve(projectRoot, "../larscuzner-com");
const sqlPath = path.join(sourceRoot, "larscuzner_com.sql");
const xmlPath = path.join(sourceRoot, "arscuzner.WordPress.2026-03-14.xml");
const outputPath = path.join(projectRoot, "src/data/generated/wordpress-recovery.json");
const visibleStatuses = new Set(["publish", "draft", "private", "pending", "future"]);

function readRequiredFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required source file: ${filePath}`);
  }

  return fs.readFileSync(filePath, "utf8");
}

function parsePhpSerializedList(value) {
  if (!value) {
    return [];
  }

  return [...value.matchAll(/"([^"]+\/[^"]+\.php)"/g)].map((match) => match[1]);
}

function decodeSqlString(value) {
  return value
    .replace(/\\\\/g, "\\")
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\r/g, "\r")
    .replace(/\\n/g, "\n")
    .replace(/\\0/g, "\0");
}

function normalizeToken(token) {
  const trimmed = token.trim();

  if (trimmed === "NULL") {
    return null;
  }

  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return decodeSqlString(trimmed.slice(1, -1));
  }

  if (/^-?\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed;
}

function splitTupleFields(tupleBody) {
  const fields = [];
  let current = "";
  let inString = false;

  for (let index = 0; index < tupleBody.length; index += 1) {
    const char = tupleBody[index];
    const previous = tupleBody[index - 1];

    if (char === "'" && previous !== "\\") {
      inString = !inString;
      current += char;
      continue;
    }

    if (char === "," && !inString) {
      fields.push(normalizeToken(current));
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    fields.push(normalizeToken(current));
  }

  return fields;
}

function parseTuples(valuesBlock) {
  const tuples = [];
  let current = "";
  let depth = 0;
  let inString = false;

  for (let index = 0; index < valuesBlock.length; index += 1) {
    const char = valuesBlock[index];
    const previous = valuesBlock[index - 1];

    if (char === "'" && previous !== "\\") {
      inString = !inString;
    }

    if (!inString && char === "(") {
      depth += 1;
    }

    if (depth > 0) {
      current += char;
    }

    if (!inString && char === ")") {
      depth -= 1;

      if (depth === 0) {
        tuples.push(current.slice(1, -1));
        current = "";
      }
    }
  }

  return tuples;
}

function collectInsertStatements(sql, tableName) {
  const statements = [];
  const marker = `INSERT INTO \`${tableName}\` (`;
  let startIndex = sql.indexOf(marker);

  while (startIndex !== -1) {
    let inString = false;
    let endIndex = startIndex;

    for (; endIndex < sql.length; endIndex += 1) {
      const char = sql[endIndex];
      const previous = sql[endIndex - 1];

      if (char === "'" && previous !== "\\") {
        inString = !inString;
      }

      if (char === ";" && !inString) {
        statements.push(sql.slice(startIndex, endIndex + 1));
        break;
      }
    }

    startIndex = sql.indexOf(marker, endIndex + 1);
  }

  return statements;
}

function extractTableRows(sql, tableName) {
  const rows = [];
  const regex = new RegExp(`INSERT INTO \`${tableName}\` \\(([^)]+)\\) VALUES\\s*([\\s\\S]*);`);

  for (const statement of collectInsertStatements(sql, tableName)) {
    const match = statement.match(regex);

    if (!match) {
      continue;
    }

    const columns = match[1].split(",").map((column) => column.replace(/`/g, "").trim());
    const tuples = parseTuples(match[2]);

    for (const tuple of tuples) {
      const values = splitTupleFields(tuple);
      const row = {};

      columns.forEach((column, index) => {
        row[column] = values[index] ?? null;
      });

      rows.push(row);
    }
  }

  return rows;
}

function collectXmlSummary(xml) {
  const title = xml.match(/<channel>\s*<title>(?:<!\[CDATA\[)?([^<\]]+)/)?.[1]?.trim() ?? "";
  const baseSiteUrl = xml.match(/<wp:base_site_url>([^<]+)<\/wp:base_site_url>/)?.[1] ?? "";
  const generator = xml.match(/<generator>([^<]+)<\/generator>/)?.[1] ?? "";
  const postTypeCounts = {};

  for (const match of xml.matchAll(/<wp:post_type><!\[CDATA\[([^\]]+)\]\]><\/wp:post_type>/g)) {
    const postType = match[1];
    postTypeCounts[postType] = (postTypeCounts[postType] ?? 0) + 1;
  }

  return { title, baseSiteUrl, generator, postTypeCounts };
}

function getOptionMap(rows) {
  return Object.fromEntries(rows.map((row) => [row.option_name, row.option_value]));
}

function stripHtml(value) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&#8217;/g, "’")
    .replace(/&#8211;/g, "–")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function buildPublicUrl(siteUrl, slug, kind) {
  if (!siteUrl) {
    return slug ? `/${slug}/` : "/";
  }

  if (kind === "attachments") {
    return siteUrl;
  }

  if (!slug) {
    return siteUrl;
  }

  return `${siteUrl.replace(/\/$/, "")}/${slug}/`;
}

function main() {
  const sql = readRequiredFile(sqlPath);
  const xml = readRequiredFile(xmlPath);

  const wpOptions = getOptionMap(extractTableRows(sql, "wp_options"));
  const blogOptions = getOptionMap(extractTableRows(sql, "blog_options"));
  const wpTerms = extractTableRows(sql, "wp_terms");
  const wpTaxonomies = extractTableRows(sql, "wp_term_taxonomy");
  const wpTermRelationships = extractTableRows(sql, "wp_term_relationships");
  const wpPosts = extractTableRows(sql, "wp_posts");
  const blogPosts = extractTableRows(sql, "blog_posts");
  const wpPostMeta = extractTableRows(sql, "wp_postmeta");

  const termById = new Map(wpTerms.map((term) => [term.term_id, term]));
  const taxonomyByTermTaxonomyId = new Map(wpTaxonomies.map((taxonomy) => [taxonomy.term_taxonomy_id, taxonomy]));
  const attachmentMeta = new Map();
  const postMeta = new Map();
  const relationshipsByObjectId = new Map();
  const postById = new Map(wpPosts.map((post) => [post.ID, post]));

  for (const meta of wpPostMeta) {
    if (!attachmentMeta.has(meta.post_id)) {
      attachmentMeta.set(meta.post_id, {});
    }

    attachmentMeta.get(meta.post_id)[meta.meta_key] = meta.meta_value;

    if (!postMeta.has(meta.post_id)) {
      postMeta.set(meta.post_id, {});
    }

    postMeta.get(meta.post_id)[meta.meta_key] = meta.meta_value;
  }

  for (const relationship of wpTermRelationships) {
    const bucket = relationshipsByObjectId.get(relationship.object_id) ?? [];
    bucket.push(relationship.term_taxonomy_id);
    relationshipsByObjectId.set(relationship.object_id, bucket);
  }

  const collectTermsForObject = (objectId) =>
    (relationshipsByObjectId.get(objectId) ?? [])
      .map((termTaxonomyId) => taxonomyByTermTaxonomyId.get(termTaxonomyId))
      .filter(Boolean)
      .map((taxonomy) => {
        const term = termById.get(taxonomy.term_id);

        return {
          id: taxonomy.term_taxonomy_id,
          taxonomy: taxonomy.taxonomy,
          slug: term?.slug ?? "",
          name: decodeHtmlEntities(term?.name ?? "(untitled term)"),
        };
      });

  const buildContentRecord = (post, kind) => ({
    id: post.ID,
    title: decodeHtmlEntities(post.post_title || `(untitled ${kind.slice(0, -1)})`),
    slug: post.post_name || "",
    date: post.post_date,
    status: post.post_status,
    excerpt: truncate(stripHtml(post.post_excerpt || post.post_content || ""), 180),
    content: post.post_content || "",
    url: buildPublicUrl(wpOptions.siteurl ?? "", post.post_name || "", kind),
    terms: collectTermsForObject(post.ID).filter((term) => term.taxonomy !== "nav_menu"),
    linkedAttachmentIds: [],
  });

  const allPages = wpPosts
    .filter((post) => post.post_type === "page" && visibleStatuses.has(post.post_status))
    .map((post) => buildContentRecord(post, "pages"))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const allPosts = wpPosts
    .filter((post) => post.post_type === "post" && visibleStatuses.has(post.post_status))
    .map((post) => buildContentRecord(post, "posts"))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const publishedPages = allPages.filter((post) => post.status === "publish");
  const publishedPosts = allPosts.filter((post) => post.status === "publish");

  const attachments = wpPosts
    .filter((post) => post.post_type === "attachment")
    .map((post) => {
      const meta = attachmentMeta.get(post.ID) ?? {};

      return {
        id: post.ID,
        title: decodeHtmlEntities(post.post_title || "(untitled attachment)"),
        slug: post.post_name || "",
        url: post.guid || "",
        file: meta._wp_attached_file ?? "",
        mimeType: post.post_mime_type || "",
        linkedFrom: [],
      };
    })
    .sort((a, b) => String(a.file || a.url).localeCompare(String(b.file || b.url)));

  const attachmentById = new Map(attachments.map((attachment) => [attachment.id, attachment]));
  const attachmentLinkPatterns = attachments.flatMap((attachment) => {
    const inferredUploadUrl = attachment.file ? `${(wpOptions.siteurl ?? "").replace(/\/$/, "")}/wp-content/uploads/${attachment.file}` : "";
    return [attachment.url, inferredUploadUrl]
      .filter(Boolean)
      .map((pattern) => ({ id: attachment.id, pattern }));
  });

  for (const record of [...allPosts, ...allPages]) {
    const linkedIds = new Set();

    for (const pattern of attachmentLinkPatterns) {
      if (record.content.includes(pattern.pattern)) {
        linkedIds.add(pattern.id);
      }
    }

    for (const match of record.content.matchAll(/wp-image-(\d+)/g)) {
      linkedIds.add(Number(match[1]));
    }

    record.linkedAttachmentIds = [...linkedIds].filter((id) => attachmentById.has(id));

    for (const attachmentId of record.linkedAttachmentIds) {
      attachmentById.get(attachmentId).linkedFrom.push({
        id: record.id,
        kind: publishedPosts.some((post) => post.id === record.id) ? "posts" : "pages",
        title: record.title,
        slug: record.slug,
      });
    }
  }

  const taxonomies = wpTaxonomies
    .filter((taxonomy) => taxonomy.taxonomy !== "link_category")
    .map((taxonomy) => {
      const term = termById.get(taxonomy.term_id);

      return {
        id: taxonomy.term_taxonomy_id,
        taxonomy: taxonomy.taxonomy,
        slug: term?.slug ?? "",
        name: decodeHtmlEntities(term?.name ?? "(untitled term)"),
        count: taxonomy.count,
      };
    })
    .sort((a, b) => `${a.taxonomy}:${a.name}`.localeCompare(`${b.taxonomy}:${b.name}`));

  const menus = wpTaxonomies
    .filter((taxonomy) => taxonomy.taxonomy === "nav_menu")
    .map((taxonomy) => {
      const term = termById.get(taxonomy.term_id);

      return {
        id: taxonomy.term_id,
        name: decodeHtmlEntities(term?.name ?? "(untitled menu)"),
        slug: term?.slug ?? "",
      };
    });

  const menuTaxonomyIds = new Set(
    wpTaxonomies.filter((taxonomy) => taxonomy.taxonomy === "nav_menu").map((taxonomy) => taxonomy.term_taxonomy_id),
  );

  const menuItems = wpPosts
    .filter((post) => post.post_type === "nav_menu_item")
    .map((post) => {
      const meta = postMeta.get(post.ID) ?? {};
      const menuTermTaxonomyId = (relationshipsByObjectId.get(post.ID) ?? []).find((id) => menuTaxonomyIds.has(id)) ?? null;
      const menuTaxonomy = menuTermTaxonomyId ? taxonomyByTermTaxonomyId.get(menuTermTaxonomyId) : null;
      const targetObjectId = Number(meta._menu_item_object_id ?? 0) || null;
      const targetObject = targetObjectId ? postById.get(targetObjectId) : null;

      return {
        id: post.ID,
        menuId: menuTaxonomy?.term_id ?? null,
        label: decodeHtmlEntities(post.post_title || targetObject?.post_title || meta._menu_item_object || "Untitled menu item"),
        slug: post.post_name || "",
        parentId: Number(meta._menu_item_menu_item_parent ?? 0) || null,
        objectId: targetObjectId,
        objectType: meta._menu_item_object ?? "",
        type: meta._menu_item_type ?? "",
        position: Number(post.menu_order ?? 0) || 0,
        url:
          meta._menu_item_url ||
          (targetObject
            ? buildPublicUrl(wpOptions.siteurl ?? "", targetObject.post_name || "", `${targetObject.post_type}s`)
            : ""),
      };
    })
    .filter((item) => item.menuId !== null)
    .sort((a, b) => {
      if (a.menuId !== b.menuId) {
        return a.menuId - b.menuId;
      }

      if (a.position !== b.position) {
        return a.position - b.position;
      }

      return a.label.localeCompare(b.label);
    });

  const snapshot = {
    generatedAt: new Date().toISOString(),
    sources: {
      sqlPath,
      xmlPath,
    },
    rootSite: {
      siteUrl: wpOptions.siteurl ?? "",
      homeUrl: wpOptions.home ?? "",
      permalinkStructure: wpOptions.permalink_structure ?? "",
      showOnFront: wpOptions.show_on_front ?? "",
      pageOnFront: Number(wpOptions.page_on_front ?? 0) || null,
      pageForPosts: Number(wpOptions.page_for_posts ?? 0) || null,
      template: wpOptions.template ?? "",
      stylesheet: wpOptions.stylesheet ?? "",
      activePlugins: parsePhpSerializedList(wpOptions.active_plugins),
    },
    blogSite: {
      siteUrl: blogOptions.siteurl ?? "",
      homeUrl: blogOptions.home ?? "",
      permalinkStructure: blogOptions.permalink_structure ?? "",
      showOnFront: blogOptions.show_on_front ?? "",
      pageOnFront: Number(blogOptions.page_on_front ?? 0) || null,
      pageForPosts: Number(blogOptions.page_for_posts ?? 0) || null,
      template: blogOptions.template ?? "",
      stylesheet: blogOptions.stylesheet ?? "",
      activePlugins: parsePhpSerializedList(blogOptions.active_plugins),
    },
    xmlSummary: collectXmlSummary(xml),
    menus,
    menuItems,
    taxonomies,
    posts: publishedPosts,
    pages: publishedPages,
    allPosts,
    allPages,
    attachments,
    legacyBlog: {
      posts: blogPosts.filter((post) => post.post_type === "post" && post.post_status === "publish").length,
      pages: blogPosts.filter((post) => post.post_type === "page" && post.post_status === "publish").length,
    },
    signals: {
      usesVisualComposerShortcodes: wpPosts.some(
        (post) => typeof post.post_content === "string" && /\[vc_(row|column|section)/.test(post.post_content),
      ),
      usesElementorTaxonomy: wpTaxonomies.some((taxonomy) => taxonomy.taxonomy === "elementor_library_type"),
      usesWooCommerceTaxonomies: wpTaxonomies.some((taxonomy) => String(taxonomy.taxonomy).startsWith("product_")),
    },
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);

  console.log(`Wrote recovery snapshot to ${outputPath}`);
  console.log(`Recovered ${allPosts.length} posts (${publishedPosts.length} published), ${allPages.length} pages (${publishedPages.length} published), and ${attachments.length} attachments.`);
}

main();
