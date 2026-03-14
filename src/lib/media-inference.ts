import type { EditorDocument, EditorMediaBlock } from "@/lib/editor-schema";
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

export function getRecoveredMediaBlock(document: EditorDocument, attachments: AttachmentRecord[]) {
  const mediaBlocks = document.blocks.filter((block): block is EditorMediaBlock => block.type === "media");
  const firstRealMedia = mediaBlocks.find((block) => block.url.trim());

  if (firstRealMedia) {
    return firstRealMedia;
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

  const recovered = getRecoveredMediaBlock(document, attachments);

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
