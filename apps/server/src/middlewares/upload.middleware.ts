import type { ErrorRequestHandler } from "express";
import { MulterError } from "multer";

const uploadMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof MulterError) {
        res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
            error: (error.code === "LIMIT_FILE_SIZE"
                ? "File exceeds the 10 MB upload limit."
                : error.message
            )
        });
        return;
    }

    res.status(400).json({
        error: (error instanceof Error
            ? error.message
            : "An unexpected error occurred."
        )
    });
};

export { uploadMiddleware }