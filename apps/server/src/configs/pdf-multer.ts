// src/configs/pdf-multer.ts
import multer from "multer";
import path from "node:path";

const MAX_PDF_BYTES = 25 * 1024 * 1024;

export const pdfUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_PDF_BYTES, files: 1 },
    fileFilter(_req, file, callback) {
        const extension = path.extname(file.originalname).toLowerCase();

        if (extension !== ".pdf" || file.mimetype !== "application/pdf") {
            callback(new Error("Only PDF files are supported."));
            return;
        }

        callback(null, true);
    },
});