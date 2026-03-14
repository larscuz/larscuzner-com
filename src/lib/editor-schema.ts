export type EditorTextBlock = {
  id: string;
  type: "text";
  html: string;
  width: "narrow" | "wide";
};

export type EditorMediaBlock = {
  id: string;
  type: "media";
  mediaType: "image" | "video" | "embed";
  url: string;
  title: string;
  caption: string;
  alt: string;
  aspect: "landscape" | "portrait" | "square" | "ultrawide";
  emphasis: "standard" | "feature";
};

export type EditorBlock = EditorTextBlock | EditorMediaBlock;

export type EditorDocument = {
  version: 1;
  theme: "terminal";
  blocks: EditorBlock[];
};

function slugifyFragment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "block";
}

export function createBlockId(prefix: string, seed?: string) {
  const suffix = Math.random().toString(36).slice(2, 8);
  const base = seed ? slugifyFragment(seed).slice(0, 24) : prefix;
  return `${prefix}-${base}-${suffix}`;
}

export function createTextBlock(html = "<p>Start writing here.</p>"): EditorTextBlock {
  return {
    id: createBlockId("text"),
    type: "text",
    html,
    width: "wide",
  };
}

export function createMediaBlock(): EditorMediaBlock {
  return {
    id: createBlockId("media"),
    type: "media",
    mediaType: "image",
    url: "",
    title: "Media box",
    caption: "",
    alt: "",
    aspect: "landscape",
    emphasis: "standard",
  };
}

export function createEditorDocumentFromBody(body: string): EditorDocument {
  const trimmed = body.trim();

  return {
    version: 1,
    theme: "terminal",
    blocks: [createTextBlock(trimmed || "<p>This entry is ready for a fresh layout.</p>")],
  };
}

export function normalizeEditorDocument(value: unknown, fallbackBody: string): EditorDocument {
  if (!value || typeof value !== "object") {
    return createEditorDocumentFromBody(fallbackBody);
  }

  const candidate = value as Partial<EditorDocument>;
  const rawBlocks = Array.isArray(candidate.blocks) ? candidate.blocks : [];
  const blocks = rawBlocks.reduce<EditorBlock[]>((accumulator, block) => {
    if (!block || typeof block !== "object" || typeof (block as { type?: unknown }).type !== "string") {
      return accumulator;
    }

    if ((block as { type: string }).type === "text") {
      const textBlock = block as Partial<EditorTextBlock>;
      accumulator.push(
        {
          id: typeof textBlock.id === "string" ? textBlock.id : createBlockId("text"),
          type: "text",
          html: typeof textBlock.html === "string" && textBlock.html.trim() ? textBlock.html : "<p></p>",
          width: textBlock.width === "narrow" ? "narrow" : "wide",
        } satisfies EditorTextBlock,
      );
      return accumulator;
    }

    if ((block as { type: string }).type === "media") {
      const mediaBlock = block as Partial<EditorMediaBlock>;
      accumulator.push(
        {
          id: typeof mediaBlock.id === "string" ? mediaBlock.id : createBlockId("media"),
          type: "media",
          mediaType:
            mediaBlock.mediaType === "video" || mediaBlock.mediaType === "embed" ? mediaBlock.mediaType : "image",
          url: typeof mediaBlock.url === "string" ? mediaBlock.url : "",
          title: typeof mediaBlock.title === "string" ? mediaBlock.title : "",
          caption: typeof mediaBlock.caption === "string" ? mediaBlock.caption : "",
          alt: typeof mediaBlock.alt === "string" ? mediaBlock.alt : "",
          aspect:
            mediaBlock.aspect === "portrait" || mediaBlock.aspect === "square" || mediaBlock.aspect === "ultrawide"
              ? mediaBlock.aspect
              : "landscape",
          emphasis: mediaBlock.emphasis === "feature" ? "feature" : "standard",
        } satisfies EditorMediaBlock,
      );
      return accumulator;
    }

    return accumulator;
  }, []);

  return {
    version: 1,
    theme: "terminal",
    blocks: blocks.length > 0 ? blocks : createEditorDocumentFromBody(fallbackBody).blocks,
  };
}

export function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function deriveExcerptFromDocument(document: EditorDocument) {
  const text = document.blocks
    .filter((block): block is EditorTextBlock => block.type === "text")
    .map((block) => stripHtml(block.html))
    .join(" ")
    .trim();

  if (!text) {
    return "";
  }

  return text.length > 180 ? `${text.slice(0, 177).trimEnd()}...` : text;
}

export function renderDocumentToLegacyHtml(document: EditorDocument) {
  return document.blocks
    .map((block) => {
      if (block.type === "text") {
        return block.html;
      }

      if (!block.url) {
        return "";
      }

      return `<figure data-media-type="${block.mediaType}"><p><a href="${block.url}">${block.title || block.url}</a></p>${
        block.caption ? `<figcaption>${block.caption}</figcaption>` : ""
      }</figure>`;
    })
    .filter(Boolean)
    .join("\n\n");
}
