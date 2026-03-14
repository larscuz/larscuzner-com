import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const sourceRoot = process.env.WP_SOURCE_ROOT
  ? path.resolve(process.env.WP_SOURCE_ROOT)
  : path.resolve(projectRoot, "../larscuzner-com");
const outputPath = path.join(projectRoot, "src/data/generated/media-library.json");

const collectionRoots = [
  { key: "root-uploads", relativePath: "wp-content/uploads", baseUrl: "http://larscuzner.com/wp-content/uploads/" },
  { key: "blog-uploads", relativePath: "blog/wp-content/uploads", baseUrl: "http://larscuzner.com/blog/wp-content/uploads/" },
  { key: "media", relativePath: "media", baseUrl: "http://larscuzner.com/media/" },
  { key: "static", relativePath: "static", baseUrl: "http://larscuzner.com/static/" },
  { key: "imagesonline", relativePath: "imagesonline", baseUrl: "http://larscuzner.com/imagesonline/" },
  { key: "personal", relativePath: "personal", baseUrl: "http://larscuzner.com/personal/" },
];

const extensionMap = {
  ".jpg": "image",
  ".jpeg": "image",
  ".png": "image",
  ".gif": "image",
  ".webp": "image",
  ".svg": "image",
  ".mp4": "video",
  ".webm": "video",
  ".mov": "video",
  ".m4v": "video",
  ".avi": "video",
  ".mp3": "audio",
  ".wav": "audio",
  ".ogg": "audio",
  ".pdf": "document",
};

function normalizeSlashes(value) {
  return value.replace(/\\/g, "/");
}

function isDerivative(filename) {
  return /-(\d+)x(\d+)(?=\.[^.]+$)/i.test(filename);
}

function removeDerivativeSuffix(filename) {
  return filename.replace(/-(\d+)x(\d+)(?=\.[^.]+$)/i, "");
}

function createLabel(filename) {
  return removeDerivativeSuffix(filename)
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function scanCollection(collection) {
  const absoluteRoot = path.join(sourceRoot, collection.relativePath);

  if (!fs.existsSync(absoluteRoot)) {
    return [];
  }

  const entries = [];

  function walk(currentPath) {
    for (const name of fs.readdirSync(currentPath)) {
      const fullPath = path.join(currentPath, name);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
        continue;
      }

      const extension = path.extname(name).toLowerCase();
      const mediaType = extensionMap[extension];

      if (!mediaType) {
        continue;
      }

      const relativePath = normalizeSlashes(path.relative(sourceRoot, fullPath));
      const relativeInsideCollection = normalizeSlashes(path.relative(absoluteRoot, fullPath));
      const filename = path.basename(name);

      entries.push({
        id: `${collection.key}:${relativePath}`,
        collection: collection.key,
        mediaType,
        filename,
        label: createLabel(filename),
        relativePath,
        relativeInsideCollection,
        fileExtension: extension.replace(".", ""),
        fileSizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        previewUrl: `${collection.baseUrl}${encodeURI(relativeInsideCollection)}`,
        isDerivative: isDerivative(filename),
        originalKey: removeDerivativeSuffix(relativeInsideCollection.toLowerCase()),
      });
    }
  }

  walk(absoluteRoot);
  return entries;
}

const mediaFiles = collectionRoots.flatMap(scanCollection).sort((left, right) => left.relativePath.localeCompare(right.relativePath));

const originals = [];
const variantsByOriginal = new Map();

for (const item of mediaFiles) {
  if (item.isDerivative) {
    const count = variantsByOriginal.get(item.originalKey) ?? 0;
    variantsByOriginal.set(item.originalKey, count + 1);
    continue;
  }

  originals.push({
    ...item,
    variantCount: 0,
  });
}

for (const original of originals) {
  original.variantCount = variantsByOriginal.get(original.originalKey) ?? 0;
}

const output = {
  generatedAt: new Date().toISOString(),
  sourceRoot,
  totals: {
    rawFiles: mediaFiles.length,
    originalFiles: originals.length,
  },
  collections: collectionRoots
    .map((collection) => {
      const items = originals.filter((item) => item.collection === collection.key);
      return {
        key: collection.key,
        relativePath: collection.relativePath,
        count: items.length,
        byType: items.reduce((accumulator, item) => {
          accumulator[item.mediaType] = (accumulator[item.mediaType] ?? 0) + 1;
          return accumulator;
        }, {}),
      };
    })
    .filter((collection) => collection.count > 0),
  items: originals,
};

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);

console.log(`Wrote media inventory to ${outputPath}`);
console.log(`Indexed ${output.totals.originalFiles} original media files from ${output.totals.rawFiles} raw files.`);
