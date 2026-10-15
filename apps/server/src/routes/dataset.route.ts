import { Router } from "express";
import { upload } from "../config/multer.js";
import { uploadFile } from "../controllers/index.js";
import type { Router as RouterType } from "express";

const router: RouterType = Router();

router.post("/upload", upload.single("file"), uploadFile);

export { router }