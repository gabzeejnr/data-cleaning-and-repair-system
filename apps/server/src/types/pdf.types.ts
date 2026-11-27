interface ExtractedTextItem {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ExtractedPDFPage {
    pageNumber: number;
    width: number;
    height: number;
    items: ExtractedTextItem[];
}

interface PDFTable {
    pageNumber: number;
    columnStarts: number[];
    rows: string[][];
}

interface Cell {
    x: number;
    text: string;
}

interface Line {
    y: number;
    cells: Cell[];
}


export type { ExtractedPDFPage, ExtractedTextItem, PDFTable, Cell, Line }