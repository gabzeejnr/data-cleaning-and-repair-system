import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });
import { ServerError } from "../libs/controller.lib.js";

import type { Request, Response } from "express";

function uploadFile(req: Request, res: Response) {
    try {
        if (!req.file) {
            res.status(400).js
            return;
        }
    } catch (err) {
        res.status(500).json({error: ServerError})
    }
}

export { uploadFile }