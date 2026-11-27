import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractPDFText } from "../services/pdf/pdf-text.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const filePath = path.resolve(__dirname, "../data/sample.pdf");
    const buffer = await fs.readFile(filePath);

    const pages = await extractPDFText(buffer);

    console.log(JSON.stringify(pages, null, 2));
}

main().catch(console.error);