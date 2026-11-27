import { Router } from "express";
import { upload } from "../../configs/multer.js";
import { pdfUpload } from "../../configs/pdf-multer.js";
import { validateSchema } from "../../middlewares/index.js";
import { duplicateZod, repairMissingValuesZod } from "../../apis/datasets/index.js";
import {
    uploadFile, detectDuplicates, getDatasets, getDatasetsId, getDatasetIssues,
    getDatasetIdRows, getSummary, downloadDataset, saveCleanedDataset, saveRepairs,
    getReports, readPdfController, uploadPdfController
} from "../../controllers/index.js";
import type { Router as RouterType } from "express";


const router: RouterType = Router();

router.get("", getDatasets);
router.get("/summary", getSummary);
router.get("/reports", getReports)
router.get("/:id/issues", getDatasetIssues);
router.get("/:id/rows", getDatasetIdRows);
router.get("/:id/download", downloadDataset);
router.get("/:id", getDatasetsId);
router.post("/upload", upload.single("file"), uploadFile);
router.post("/read-pdf", pdfUpload.single("file"), readPdfController)
router.post("/upload-pdf", pdfUpload.single("file"), uploadPdfController)
router.post("/save-repairs", saveRepairs);
router.post("/detect-duplicate", validateSchema(duplicateZod), detectDuplicates);
router.post("/save-cleaned", validateSchema(repairMissingValuesZod), saveCleanedDataset);

export { router as datasetRoutes }