import { Router } from "express";
import { upload } from "../../configs/multer.js";
import { validateSchema } from "../../middlewares/index.js";
import { duplicateZod, repairMissingValuesZod } from "../../apis/datasets/index.js";
import { uploadFile, detectDuplicates, repairMissingValue, getDatasets, getDatasetsId, getDatasetIssues, getDatasetIdRows } from "../../controllers/index.js";
import type { Router as RouterType } from "express";
import { saveCleanedDataset } from "../../controllers/saveCleaned.controller.js";
import { saveRepairs } from "../../controllers/saveRepairs.controller.js";

const router: RouterType = Router();

router.get("", getDatasets);
router.get("/:id/issues", getDatasetIssues);
router.get("/:id/rows", getDatasetIdRows);
router.get("/:id", getDatasetsId);
router.post("/upload", upload.single("file"), uploadFile);
router.post("/save-repairs", saveRepairs);
router.post("/detect-duplicate", validateSchema(duplicateZod), detectDuplicates);
router.post("/repair-missing-values", validateSchema(repairMissingValuesZod), repairMissingValue);
router.post("/save-cleaned", validateSchema(repairMissingValuesZod), saveCleanedDataset);

export { router as datasetRoutes }