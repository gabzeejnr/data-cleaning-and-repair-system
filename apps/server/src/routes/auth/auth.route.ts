import { Router } from "express";
import { validateSchema } from "../../middlewares/zod.middleware.js";
import { userRegisterationZod, userLoginZod } from "../../apis/auth/index.js";
import { loginUser, registerUser } from "../../controllers/index.js";
import type { Router as RouterType } from "express";

const router: RouterType = Router();

router.post("/register", validateSchema(userRegisterationZod), registerUser);
router.post("/login", validateSchema(userLoginZod), loginUser);

export { router as authRoutes }