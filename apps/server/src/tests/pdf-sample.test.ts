import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { readPDF } from "../services/pdf/pdf.service.js";

const samplePath = new URL("../data/sample.pdf", import.meta.url);

describe("readPDF with sample.pdf", () => {
    it("extracts one page and one table", async () => {
        const buffer = await readFile(samplePath);
        const result = await readPDF(buffer);

        expect(result.pageCount).toBe(1);
        expect(result.tables).toHaveLength(1);
    });

    it("reconstructs the student table exactly", async () => {
        const buffer = await readFile(samplePath);
        const { tables } = await readPDF(buffer);

        expect(tables[0]!.rows).toEqual([
            ["Student ID", "Name", "Age", "Department", "Score"],
            ["STU-001", "Ada Okafor", "21", "Computer Science", "87"],
            ["STU-002", "Tunde Bello", "NULL", "Mathematics", "74"],
            ["STU-003", "Mira James", "23", "Physics", "91"],
            ["STU-004", "Ada Okafor", "21", "Computer Science", "87"],
            ["STU-005", "Chidi Nwosu", "22", "Chemistry", "68"],
        ]);
    });

    it("rejects a file that is not a PDF", async () => {
        await expect(readPDF(Buffer.from("hello world"))).rejects.toThrow(
            "File is not a valid PDF."
        );
    });
});