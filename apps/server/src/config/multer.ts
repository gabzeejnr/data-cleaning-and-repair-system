import multer from "multer";
import path from "path";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ROWS = 50_000;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1
    },
    fileFilter: function (_req, file, callback) {
        const extension = path.extname(file.originalname).toLowerCase();

        if(extension !== ".csv" && extension !== ".xlsx") {
            callback(new Error ("Only CSV and XLSX files are supported."));
            return
        }

        callback(null, true)
    }
})