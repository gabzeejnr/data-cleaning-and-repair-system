import { Router } from "express";
import { datasetRoutes } from "./dataset.route.js";
import type { Router as RouterType } from "express"
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router: RouterType = Router()

router.use("/datasets", requireAuth, datasetRoutes)

export { router as apiRouter }