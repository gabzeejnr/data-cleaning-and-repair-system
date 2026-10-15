import { env } from "process";
import express, { json } from "express";
import cors from "cors";
import type { Express } from "express";
import { apiRouter } from "./routes/route.js";
import { uploadMiddleware } from "./controllers/dataset.controller.js";

const app: Express = express();
const PORT = Number(env.PORT) || 4000;

app.use(cors({
    origin: "*"
}));
app.use(json({ limit: "1mb" }));

app.use("/api", apiRouter);

app.use(uploadMiddleware)


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});