import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { ExtractedPDFPage, ExtractedTextItem } from "../../types/pdf.types.js";


async function extractPDFText(buffer: Buffer): Promise<ExtractedPDFPage[]> {
    const document = await getDocument({
        data: new Uint8Array(buffer),
        useSystemFonts: true
    }).promise;

    const pages: ExtractedPDFPage[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
        const page = await document.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });
        const content = await page.getTextContent();

        const items: ExtractedTextItem[] = content.items
            .filter(item => "str" in item && item.str.trim().length > 0)
            .map(item => {
                if (!("str" in item)) {
                    throw new Error("Invalid PDF text item.");
                }

                const [, , , , x, y] = item.transform;

                return {
                    text: item.str,
                    x,
                    y,
                    width: item.width,
                    height: item.height
                };
            });

        pages.push({
            pageNumber,
            width: viewport.width,
            height: viewport.height,
            items
        });
    }

    await document.cleanup();

    return pages;
}

export { extractPDFText };