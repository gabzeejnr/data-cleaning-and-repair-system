import { Router } from "express";
import { upload } from "../config/multer.js";
import { validateSchema } from "../middlewares/zod.middleware.js";
import { uploadFile, detectDuplicates } from "../controllers/index.js";
import type { Router as RouterType } from "express";

const router: RouterType = Router();

router.post("/upload", upload.single("file"), uploadFile);
router.post("/detect-duplicate", validateSchema, detectDuplicates);

export { router }