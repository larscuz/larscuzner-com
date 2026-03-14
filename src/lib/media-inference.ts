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
  const existingMedia = document.blocks.find((block) => block.type === "media");

  if (existingMedia && existingMedia.type === "media") {
    return existingMedia;
  }

  for (const attachment of attachments) {
    const block = attachmentToMediaBlock(attachment);

    if (block) {
      return block;
    }
  }

  return null;
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
