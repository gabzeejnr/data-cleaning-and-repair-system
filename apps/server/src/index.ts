import { env } from "node:process";
import { IS_ACTIVE } from "./configs/env.js";
import express, { json } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import type { Express } from "express";
import { apiRouter, authRouter, healthRouter } from "./routes/index.js";
import { uploadMiddleware } from "./middlewares/index.js";
import { pool } from "./configs/db.js";

const app: Express = express();
const PORT = Number(env.PORT) || 4000;

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(cookieParser())

console.log(IS_ACTIVE);

app.use(json({ limit: "1mb" }));

console.log("// ================================================================================================")
console.log("// STARTING SERVER ==============================");
console.log("// ================================================================================================")

console.log(await pool.query(`SELECT * FROM datasets WHERE id = '9515bab4-9123-4184-97e8-0402caf0b632'`))

app.use("/auth", authRouter);
app.use("/api", apiRouter);
app.use(healthRouter)

app.use(uploadMiddleware)

app.use((_req, res) => {
    res.status(404).json({ error: "Route unknown." })
})

app.listen(PORT, () => {
    console.log("// ================================================================================================")
    console.log(`Server running at http://localhost:${PORT}==========`);
    console.log("// ================================================================================================")
});