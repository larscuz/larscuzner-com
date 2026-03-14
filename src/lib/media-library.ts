import rawLibrary from "@/data/generated/media-library.json";

export type MediaLibraryItem = {
  id: string;
  collection: string;
  mediaType: "image" | "video" | "audio" | "document";
  filename: string;
  label: string;
  relativePath: string;
  relativeInsideCollection: string;
  fileExtension: string;
  fileSizeBytes: number;
  modifiedAt: string;
  previewUrl: string;
  isDerivative: boolean;
  originalKey: string;
  variantCount: number;
};

export type MediaCollectionSummary = {
  key: string;
  relativePath: string;
  count: number;
  byType: Partial<Record<MediaLibraryItem["mediaType"], number>>;
};

export type MediaLibrarySnapshot = {
  generatedAt: string;
  sourceRoot: string;
  totals: {
    rawFiles: number;
    originalFiles: number;
  };
  collections: MediaCollectionSummary[];
  items: MediaLibraryItem[];
};

const snapshot = rawLibrary as MediaLibrarySnapshot;

export function getMediaLibrary() {
  return snapshot;
}

export function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
