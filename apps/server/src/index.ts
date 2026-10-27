import { env } from "node:process";
import { IS_ACTIVE } from "./configs/env.js";
import express, { json } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import type { Express } from "express";
import { apiRouter, authRouter, healthRouter } from "./routes/index.js";
import { uploadMiddleware } from "./middlewares/index.js";

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


app.use("/auth", authRouter);
app.use("/api", apiRouter);
app.use(healthRouter)

app.use(uploadMiddleware)

app.use((_req, res) => {
    res.status(404).json({ error: "Route unknown." })
})

app.listen(PORT, () => {
    console.log("// ================================================================================================")
    console.log(`Server running at http://localhost:${PORT} ==========`);
    console.log("// ================================================================================================")
});