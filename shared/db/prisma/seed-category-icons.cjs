const fs = require("fs");
const path = require("path");
const https = require("https");
const os = require("os");

const PROJECT_ROOT = path.join(__dirname, "../../..");
const ICON_DIR = path.join(PROJECT_ROOT, "public/categories/figma");

function detectExtensionFromBuffer(buffer) {
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return ".png";
  }
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return ".jpg";
  }
  const prefix = buffer.slice(0, 64).toString("utf8").trimStart().toLowerCase();
  if (prefix.startsWith("<svg") || prefix.startsWith("<?xml")) {
    return ".svg";
  }
  return ".png";
}

function getPublicIconUrl(slug, extension) {
  return `/categories/figma/${slug}${extension}`;
}

function removeSiblingIconFiles(slug, keepExtension) {
  for (const extension of [".png", ".svg", ".jpg", ".jpeg", ".webp"]) {
    if (extension === keepExtension) {
      continue;
    }
    const siblingPath = path.join(ICON_DIR, `${slug}${extension}`);
    if (fs.existsSync(siblingPath)) {
      fs.unlinkSync(siblingPath);
    }
  }
}

function normalizeExistingIconFile(slug) {
  const candidates = [".png", ".svg", ".jpg", ".jpeg", ".webp"]
    .map((extension) => ({
      extension,
      localPath: path.join(ICON_DIR, `${slug}${extension}`),
    }))
    .filter((entry) => fs.existsSync(entry.localPath));

  if (candidates.length === 0) {
    return null;
  }

  const source = candidates[0];
  const buffer = fs.readFileSync(source.localPath);
  const detectedExtension = detectExtensionFromBuffer(buffer);
  const targetPath = path.join(ICON_DIR, `${slug}${detectedExtension}`);

  if (source.localPath !== targetPath) {
    fs.writeFileSync(targetPath, buffer);
  }

  removeSiblingIconFiles(slug, detectedExtension);
  return getPublicIconUrl(slug, detectedExtension);
}

function downloadFile(url, destinationPath) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(destinationPath);
    https
      .get(url, (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          fileStream.close();
          if (fs.existsSync(destinationPath)) {
            fs.unlinkSync(destinationPath);
          }
          downloadFile(response.headers.location, destinationPath).then(resolve).catch(reject);
          return;
        }
        if (response.statusCode !== 200) {
          fileStream.close();
          fs.unlink(destinationPath, () => {});
          reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
          return;
        }
        response.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close(resolve);
        });
      })
      .on("error", (error) => {
        fileStream.close();
        fs.unlink(destinationPath, () => {});
        reject(error);
      });
  });
}

async function resolveCategoryIconUrl(slug, remoteIconUrl, options = {}) {
  const localIconOnly = Boolean(options.localIconOnly);

  fs.mkdirSync(ICON_DIR, { recursive: true });

  const existingUrl = normalizeExistingIconFile(slug);
  if (existingUrl) {
    return existingUrl;
  }

  if (localIconOnly) {
    return null;
  }

  if (!remoteIconUrl) {
    return null;
  }

  const tempPath = path.join(os.tmpdir(), `degusto-category-${slug}-${Date.now()}`);
  await downloadFile(remoteIconUrl, tempPath);
  const buffer = fs.readFileSync(tempPath);
  const extension = detectExtensionFromBuffer(buffer);
  const localPath = path.join(ICON_DIR, `${slug}${extension}`);
  fs.writeFileSync(localPath, buffer);
  fs.unlinkSync(tempPath);
  removeSiblingIconFiles(slug, extension);

  return getPublicIconUrl(slug, extension);
}

module.exports = {
  resolveCategoryIconUrl,
  normalizeExistingIconFile,
};
