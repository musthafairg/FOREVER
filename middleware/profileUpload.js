import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const _filname = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filname);
const uploadDir = path.join(_dirname, "../public/uploads/profile");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  if (ext) {
    cb(null, true);
  } else {
    cb(new Error("only images allowed"));
  }
};

export const profileUpload = multer({
  storage,
  fileFilter,
});
