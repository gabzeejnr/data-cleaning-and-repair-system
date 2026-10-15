import { Router } from "express";
import { upload } from "../controllers/index.js";
import type { Router as RouterType } from "express";

const router: RouterType = Router();

router.post("/datasets/upload", upload)