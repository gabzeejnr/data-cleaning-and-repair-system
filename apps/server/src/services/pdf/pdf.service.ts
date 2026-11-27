import { validatePDF } from "./pdf-validator.js";
import { extractPDFText } from "./pdf-text.service.js";
import { detectTables, tableToCSV } from "../../helpers/pdf.js";
import type { PDFTable } from "../../types/pdf.types.js";


async function readPDF(buffer: Buffer) {
    validatePDF(buffer);

    const pages = await extractPDFText(buffer);
    const tables = detectTables(pages);

    const text = (pages
        .map(page => page.items.map(item => item.text).join(" "))
        .join("\n\n")
    )

    return {
        pageCount: pages.length,
        text,
        tables: tables.map(table => ({
            pageNumber: table.pageNumber,
            csv: tableToCSV(table),
            rows: table.rows,
        })),
    }
}

async function extractTables(buffer: Buffer): Promise<PDFTable[]> {
    validatePDF(buffer);

    const pages = await extractPDFText(buffer);
    return detectTables(pages);
}






export {readPDF, extractTables}