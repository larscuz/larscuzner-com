import type { EditorDocument, EditorMediaBlock, EditorTextBlock } from "@/lib/editor-schema";
import type { AttachmentRecord } from "@/lib/wordpress-data";

function attachmentToMediaBlock(attachment: AttachmentRecord): EditorMediaBlock | null {
  if (attachment.mimeType.startsWith("image/")) {
    return {
      id: `recovered-media-${attachment.id}`,
      type: "media",
      mediaType: "image",
      url: attachment.url,
      title: attachment.title || "Recovered image",
      caption: "Recovered from the original WordPress media library.",
      alt: attachment.title || "Recovered image",
      aspect: "landscape",
      emphasis: "feature",
    };
  }

  if (attachment.mimeType.startsWith("video/")) {
    return {
      id: `recovered-media-${attachment.id}`,
      type: "media",
      mediaType: "video",
      url: attachment.url,
      title: attachment.title || "Recovered video",
      caption: "Recovered from the original WordPress media library.",
      alt: attachment.title || "Recovered video",
      aspect: "landscape",
      emphasis: "feature",
    };
  }

  return null;
}

function decodeHtmlEntities(value: string) {
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

function getAttributeValue(tag: string, name: string) {
  const match = tag.match(new RegExp(`${name}=["']([^"']+)["']`, "i"));
  return match ? decodeHtmlEntities(match[1]) : "";
}

function createLegacyMediaBlock(type: EditorMediaBlock["mediaType"], url: string, title: string, alt = ""): EditorMediaBlock {
  return {
    id: `legacy-media-${Math.random().toString(36).slice(2, 8)}`,
    type: "media",
    mediaType: type,
    url,
    title,
    caption: "Recovered from the original WordPress content.",
    alt: alt || title,
    aspect: "landscape",
    emphasis: "feature",
  };
}

function getLegacyHtmlMediaBlock(textBlocks: EditorTextBlock[]) {
  const html = textBlocks.map((block) => block.html).join("\n");

  const imgMatch = html.match(/<img\b[^>]*>/i);
  if (imgMatch) {
    const src = getAttributeValue(imgMatch[0], "src");
    if (src) {
      return createLegacyMediaBlock(
        "image",
        src,
        getAttributeValue(imgMatch[0], "title") || getAttributeValue(imgMatch[0], "alt") || "Recovered image",
        getAttributeValue(imgMatch[0], "alt"),
      );
    }
  }

  const iframeMatch = html.match(/<iframe\b[^>]*>/i);
  if (iframeMatch) {
    const src = getAttributeValue(iframeMatch[0], "src");
    if (src) {
      return createLegacyMediaBlock("embed", src, getAttributeValue(iframeMatch[0], "title") || "Recovered embed");
    }
  }

  const videoMatch = html.match(/<video\b[^>]*>/i);
  if (videoMatch) {
    const src = getAttributeValue(videoMatch[0], "src");
    if (src) {
      return createLegacyMediaBlock("video", src, getAttributeValue(videoMatch[0], "title") || "Recovered video");
    }
  }

  const sourceMatch = html.match(/<source\b[^>]*src=["']([^"']+)["'][^>]*>/i);
  if (sourceMatch?.[1]) {
    return createLegacyMediaBlock("video", decodeHtmlEntities(sourceMatch[1]), "Recovered video");
  }

  const linkedMediaMatch = html.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/i);
  const href = linkedMediaMatch?.[1] ? decodeHtmlEntities(linkedMediaMatch[1]) : "";
  if (href && (/\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(href) || /\.(mp4|webm|ogg)(\?.*)?$/i.test(href) || /youtube\.com|youtu\.be|vimeo\.com/i.test(href))) {
    return createLegacyMediaBlock(/\.(mp4|webm|ogg)(\?.*)?$/i.test(href) || /youtube\.com|youtu\.be|vimeo\.com/i.test(href) ? "video" : "image", href, "Recovered linked media");
  }

  const plainUrlMatch = decodeHtmlEntities(html).match(/https?:\/\/[^\s<"]+/i);
  const plainUrl = plainUrlMatch?.[0] ?? "";
  if (
    plainUrl &&
    (/\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(plainUrl) ||
      /\.(mp4|webm|ogg)(\?.*)?$/i.test(plainUrl) ||
      /youtube\.com|youtu\.be|vimeo\.com/i.test(plainUrl))
  ) {
    return createLegacyMediaBlock(
      /\.(mp4|webm|ogg)(\?.*)?$/i.test(plainUrl) || /youtube\.com|youtu\.be|vimeo\.com/i.test(plainUrl) ? "video" : "image",
      plainUrl,
      "Recovered embedded media",
    );
  }

  return null;
}

export function getRecoveredMediaBlock(
  document: EditorDocument,
  attachments: AttachmentRecord[],
  options?: { includeLegacyHtml?: boolean },
) {
  const mediaBlocks = document.blocks.filter((block): block is EditorMediaBlock => block.type === "media");
  const firstRealMedia = mediaBlocks.find((block) => block.url.trim());

  if (firstRealMedia) {
    return firstRealMedia;
  }

  if (options?.includeLegacyHtml) {
    const textBlocks = document.blocks.filter((block): block is EditorTextBlock => block.type === "text");
    const legacyHtmlMedia = getLegacyHtmlMediaBlock(textBlocks);

    if (legacyHtmlMedia) {
      return legacyHtmlMedia;
    }
  }

  for (const attachment of attachments) {
    const block = attachmentToMediaBlock(attachment);

    if (block) {
      return block;
    }
  }

  const firstPlaceholderMedia = mediaBlocks[0];

  if (firstPlaceholderMedia) {
    return firstPlaceholderMedia;
  }

  return null;
}

export function promotePrimaryMedia(document: EditorDocument): EditorDocument {
  const mediaIndexes = document.blocks.reduce<number[]>((indexes, block, index) => {
    if (block.type === "media") {
      indexes.push(index);
    }

    return indexes;
  }, []);

  if (mediaIndexes.length < 2) {
    return document;
  }

  const firstMediaIndex = mediaIndexes[0];
  const firstMedia = document.blocks[firstMediaIndex];

  if (!firstMedia || firstMedia.type !== "media" || firstMedia.url.trim()) {
    return document;
  }

  const firstRealMediaIndex = mediaIndexes.find((index) => {
    const block = document.blocks[index];
    return block?.type === "media" && block.url.trim();
  });

  if (firstRealMediaIndex === undefined || firstRealMediaIndex === firstMediaIndex) {
    return document;
  }

  const firstRealMedia = document.blocks[firstRealMediaIndex];

  if (!firstRealMedia || firstRealMedia.type !== "media") {
    return document;
  }

  const blocks = [...document.blocks];
  blocks[firstMediaIndex] = {
    ...firstRealMedia,
    id: firstMedia.id,
  };
  blocks.splice(firstRealMediaIndex, 1);

  return {
    ...document,
    blocks,
  };
}

export function addRecoveredOrPlaceholderMedia(
  document: EditorDocument,
  attachments: AttachmentRecord[],
  title: string,
): EditorDocument {
  const existingMedia = document.blocks.some((block) => block.type === "media");

  if (existingMedia) {
    return document;
  }

  const recovered = getRecoveredMediaBlock(document, attachments, { includeLegacyHtml: true });

  if (recovered) {
    return {
      ...document,
      blocks: [recovered, ...document.blocks],
    };
  }

  return {
    ...document,
    blocks: [
      {
        id: `placeholder-media-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "entry"}`,
        type: "media",
        mediaType: "image",
        url: "",
        title: `${title} placeholder`,
        caption: "No linked media has been recovered for this entry yet.",
        alt: `${title} placeholder`,
        aspect: "landscape",
        emphasis: "feature",
      },
      ...document.blocks,
    ],
  };
}
