import { Router } from "express";
import { validateSchema, requireAuth } from "../../middlewares/index.js";
import { userRegisterationZod, userLoginZod } from "../../apis/auth/index.js";
import { loginUser, logOutUser, registerUser } from "../../controllers/index.js";
import type { Router as RouterType } from "express";

const router: RouterType = Router();

router.post("/register", validateSchema(userRegisterationZod), registerUser);
router.post("/login", validateSchema(userLoginZod), loginUser);
router.get("/me", requireAuth, (_req, res) => {
    res.status(200).json({ user: res.locals.user });
});
router.post("/logout", logOutUser);

export { router as authRoutes }