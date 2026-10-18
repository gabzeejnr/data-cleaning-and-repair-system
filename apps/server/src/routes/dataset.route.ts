import { Router } from "express";
import { upload } from "../configs/multer.js";
import { validateSchema } from "../middlewares/index.js";
import { duplicateZod, repairMissingValuesZod } from "../apis/datasets/index.js";
import { uploadFile, detectDuplicates, repairMissingValue } from "../controllers/index.js";
import type { Router as RouterType } from "express";
import { saveCleanedDataset } from "../controllers/saveCleaned.controller.js";

const router: RouterType = Router();

router.post("/upload", upload.single("file"), uploadFile);
router.post("/detect-duplicate", validateSchema(duplicateZod), detectDuplicates);
router.post("/repair-missing-values", validateSchema(repairMissingValuesZod), repairMissingValue);
router.post("/save-cleaned", validateSchema(repairMissingValuesZod), saveCleanedDataset);

export { router }