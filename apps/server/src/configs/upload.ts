import multer from "multer";
import path from "path";

const MB = (n: number) => (n * 1024 * 1024);

interface UploadRules {
    label: string;
    extensions: string[];
    mimetypes: string[];
    sizeMb: number;
    requireBoth?: boolean;
}

export function createUpload({ label, extensions, mimetypes, sizeMb, requireBoth = false }: UploadRules) {
    return multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: MB(sizeMb),
            files: 1
        },
        fileFilter(_req, file, callback) {
            const extensionOk = extensions.includes(path.extname(file.originalname).toLowerCase());
            const mimetypeOk = mimetypes.includes(file.mimetype);
            const accepted = (requireBoth
                ? extensionOk && mimetypeOk
                : extensionOk || mimetypeOk
            )

            if (!accepted) {
                callback(new Error(`Only ${label} files are supported.`));
                return;
            }
            callback(null, true);
        },
    })
}