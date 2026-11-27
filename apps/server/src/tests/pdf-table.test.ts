import { describe, expect, it } from "vitest";
import { detectTables, tableToCSV } from "../helpers/pdf.js";
import type { ExtractedPDFPage, ExtractedTextItem } from "../types/pdf.types.js";

function item(text: string, x: number, y: number): ExtractedTextItem {
    return { text, x, y, width: text.length * 5, height: 9 };
}

function page(items: ExtractedTextItem[]): ExtractedPDFPage {
    return { pageNumber: 1, width: 600, height: 800, items };
}

describe("detectTables", () => {
    it("detects a simple grid as one table", () => {
        const tables = detectTables([
            page([
                item("ID", 60, 600), item("Name", 160, 600), item("Score", 300, 600),
                item("A1", 60, 580), item("Ada", 160, 580), item("90", 300, 580),
                item("B2", 60, 560), item("Tunde", 160, 560), item("75", 300, 560),
            ]),
        ]);

        expect(tables).toHaveLength(1);
        expect(tables[0]!.rows).toEqual([
            ["ID", "Name", "Score"],
            ["A1", "Ada", "90"],
            ["B2", "Tunde", "75"],
        ]);
    });

    it("ignores a two-column label block", () => {
        const tables = detectTables([
            page([
                item("Dataset:", 60, 700), item("Students", 110, 700),
                item("Purpose:", 60, 680), item("Testing", 110, 680),
            ]),
        ]);

        expect(tables).toHaveLength(0);
    });

    it("joins a wrapped cell into the row above", () => {
        const tables = detectTables([
            page([
                item("ID", 60, 600), item("Name", 160, 600), item("Notes", 300, 600),
                item("A1", 60, 580), item("Ada", 160, 580), item("Late", 300, 580),
                item("submission", 300, 566),
                item("B2", 60, 540), item("Tunde", 160, 540), item("On time", 300, 540),
            ]),
        ]);

        expect(tables[0]!.rows).toEqual([
            ["ID", "Name", "Notes"],
            ["A1", "Ada", "Late submission"],
            ["B2", "Tunde", "On time"],
        ]);
    });

    it("ends the table at a paragraph below it", () => {
        const tables = detectTables([
            page([
                item("ID", 60, 600), item("Name", 160, 600), item("Score", 300, 600),
                item("A1", 60, 580), item("Ada", 160, 580), item("90", 300, 580),
                item("This is a note under the table.", 60, 560),
            ]),
        ]);

        expect(tables[0]!.rows).toEqual([
            ["ID", "Name", "Score"],
            ["A1", "Ada", "90"],
        ]);
    });

    it("finds nothing on a page with no text", () => {
        expect(detectTables([page([])])).toEqual([]);
    });
});

describe("tableToCSV", () => {
    it("quotes fields containing commas, quotes, and newlines", () => {
        const csv = tableToCSV({
            pageNumber: 1,
            columnStarts: [],
            rows: [
                ["Name", "Note"],
                ["Okafor, Ada", 'Said "hello"'],
                ["Bello", "Line one\nLine two"],
            ],
        });

        expect(csv).toBe(
            'Name,Note\n' +
            '"Okafor, Ada","Said ""hello"""\n' +
            'Bello,"Line one\nLine two"'
        );
    });

    it("leaves plain values unquoted", () => {
        const csv = tableToCSV({
            pageNumber: 1,
            columnStarts: [],
            rows: [["A", "B"], ["1", "2"]],
        });

        expect(csv).toBe("A,B\n1,2");
    });
});