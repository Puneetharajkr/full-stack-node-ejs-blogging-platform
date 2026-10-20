const { randomUUID } = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const multer = require("multer");
const sharp = require("sharp");

const uploadsDirectory = path.join(__dirname, "..", "public", "uploads");
const supportedImageTypes = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!supportedImageTypes[file.mimetype]) {
      const error = new Error("Unsupported image type");
      error.code = "UNSUPPORTED_IMAGE_TYPE";
      return callback(error);
    }

    return callback(null, true);
  },
}).single("image");

const blogImageUpload = (req, res, next) => {
  imageUpload(req, res, (error) => {
    req.blogImageUploadError = error || null;
    next();
  });
};

const getBlogImageErrorMessage = (error) => {
  if (error?.code === "LIMIT_FILE_SIZE") {
    return "Choose an image smaller than 5 MB.";
  }

  if (error?.code === "LIMIT_UNEXPECTED_FILE") {
    return "Upload one image using the cover image field.";
  }

  if (
    error?.code === "UNSUPPORTED_IMAGE_TYPE" ||
    error?.code === "INVALID_IMAGE"
  ) {
    return "Choose a valid JPEG, PNG, or WebP image.";
  }

  if (error?.name === "MulterError") {
    return "We couldn't process that upload. Please choose one image and try again.";
  }

  return null;
};

const saveBlogImage = async (file) => {
  if (!file) return null;

  const expectedFormat = supportedImageTypes[file.mimetype];
  let image = sharp(file.buffer, { limitInputPixels: 40_000_000 });
  let metadata;

  try {
    metadata = await image.metadata();
  } catch {
    const error = new Error("Invalid image data");
    error.code = "INVALID_IMAGE";
    throw error;
  }

  if (metadata.format !== expectedFormat) {
    const error = new Error("Image content does not match its file type");
    error.code = "INVALID_IMAGE";
    throw error;
  }

  const filename = `${randomUUID()}.webp`;
  const destination = path.join(uploadsDirectory, filename);
  await fs.mkdir(uploadsDirectory, { recursive: true });

  try {
    await image
      .rotate()
      .resize({
        width: 1200,
        height: 900,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toFile(destination);
  } catch (error) {
    await fs.unlink(destination).catch(() => {});
    throw error;
  }

  return `/uploads/${filename}`;
};

const removeBlogImage = async (imagePath) => {
  if (!imagePath?.startsWith("/uploads/")) return;

  const filename = path.basename(imagePath);
  await fs.unlink(path.join(uploadsDirectory, filename)).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
};

module.exports = {
  blogImageUpload,
  getBlogImageErrorMessage,
  removeBlogImage,
  saveBlogImage,
};
