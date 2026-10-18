import { Router } from "express";
import { datasetRoutes } from "./dataset.route.js";
import type { Router as RouterType } from "express"

const router: RouterType = Router()

router.use("/datasets", datasetRoutes)

export {router as apiRouter}