import { Router } from "express";
import { authRoutes } from "./auth.route.js";
import type { Router as RouterType } from "express"

const router: RouterType = Router()

router.use(authRoutes)

export { router as authRouter }