import { Router } from "express";
import { router as datasetRoute } from "./dataset.route.js";
import type { Router as RouterType } from "express";

const router: RouterType = Router();

router.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        service: "data-cleaning-system-server",
        timestamp: new Date().toISOString(),
    });
});

router.use("/datasets", datasetRoute)

export { router as apiRouter }