import multer from "multer";
import path from "path";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/logos");
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `business-${req.user.businessId}-${Date.now()}${ext}`;
    cb(null, safeName);
  },
});

function fileFilter(req, file, cb) {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Solo se permiten imágenes JPG, PNG o WEBP"));
  }

  cb(null, true);
}

export const uploadLogo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});