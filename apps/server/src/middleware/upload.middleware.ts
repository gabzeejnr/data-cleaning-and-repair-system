import express, { Request, Response } from "express";

const app = express();

app.use((err: Error & { code?: string },
    _req: Request,
    res: Response
) => { })