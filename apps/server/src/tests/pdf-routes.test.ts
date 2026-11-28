import { readFile } from "node:fs/promises";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { pdfUpload } from "../configs/multer.js";
import { readPdfController, uploadPdfController } from "../controllers/pdf.controller.js";
import { uploadMiddleware } from "../middlewares/upload.middleware.js";
import { persistDataset } from "../repositories/index.js";
import { extractTables } from "../services/pdf/pdf.service.js";
import type { PDFTable } from "../types/pdf.types.js";
import type { AccessTokenPayload } from "@data-cleaning-system/shared";

vi.mock("../repositories/index.js", () => ({
    persistDataset: vi.fn(),
}));

vi.mock("../services/index.js", () => ({
    profileDataset: vi.fn(() => ({})),
}));

// Keep the real extraction, but let tests replace it when they need a specific table shape.
vi.mock("../services/pdf/pdf.service.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../services/pdf/pdf.service.js")>();
    return { ...actual, extractTables: vi.fn(actual.extractTables) };
});

// Stands in for requireAuth so tests control the user directly.
let currentUser: AccessTokenPayload | undefined;

const app = express();
app.use((_req, res, next) => {
    if (currentUser) res.locals.user = currentUser;
    next();
});
app.post("/read-pdf", pdfUpload.single("file"), readPdfController);
app.post("/upload-pdf", pdfUpload.single("file"), uploadPdfController);
app.use(uploadMiddleware);

const samplePath = new URL("../data/sample.pdf", import.meta.url);
const sampleColumns = ["Student ID", "Name", "Age", "Department", "Score"];

function singleTable(rows: string[][]): PDFTable {
    return { pageNumber: 1, columnStarts: [], rows };
}

beforeEach(() => {
    vi.clearAllMocks();
    currentUser = {
        userId: "user-1",
        email: "email-1",
        name: "name-1",
        role: "user",
        purpose: "access"
    };
});

describe("POST /upload-pdf", () => {
    it("returns 400 when no file is sent", async () => {
        const res = await request(app).post("/upload-pdf");

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/upload a PDF/);
        expect(persistDataset).not.toHaveBeenCalled();
    });

    it("returns 400 for a non-PDF extension", async () => {
        const res = await request(app)
            .post("/upload-pdf")
            .attach("file", Buffer.from("a,b\n1,2"), { filename: "data.csv", contentType: "text/csv" });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Only PDF files are supported.");
    });

    it("returns 422 when the file is named .pdf but is not a PDF", async () => {
        const res = await request(app)
            .post("/upload-pdf")
            .attach("file", Buffer.from("hello world"), { filename: "fake.pdf", contentType: "application/pdf" });

        expect(res.status).toBe(422);
        expect(res.body.error).toBe("File is not a valid PDF.");
        expect(persistDataset).not.toHaveBeenCalled();
    });

    it("returns 401 when no user is authenticated", async () => {
        currentUser = undefined;
        const pdf = await readFile(samplePath);

        const res = await request(app)
            .post("/upload-pdf")
            .attach("file", pdf, { filename: "sample.pdf", contentType: "application/pdf" });

        expect(res.status).toBe(401);
        expect(persistDataset).not.toHaveBeenCalled();
    });

    it("returns 400 when the PDF has no tables", async () => {
        vi.mocked(extractTables).mockResolvedValueOnce([]);
        const pdf = await readFile(samplePath);

        const res = await request(app)
            .post("/upload-pdf")
            .attach("file", pdf, { filename: "empty.pdf", contentType: "application/pdf" });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/No tables with data rows/);
        expect(persistDataset).not.toHaveBeenCalled();
    });

    it("returns 413 when a table exceeds the row limit", async () => {
        const header = ["ID", "Name"];
        const body = Array.from({ length: 50_001 }, (_, i) => [`${i}`, "x"]);
        vi.mocked(extractTables).mockResolvedValueOnce([singleTable([header, ...body])]);
        const pdf = await readFile(samplePath);

        const res = await request(app)
            .post("/upload-pdf")
            .attach("file", pdf, { filename: "big.pdf", contentType: "application/pdf" });

        expect(res.status).toBe(413);
        expect(res.body.error).toMatch(/row limit/);
        expect(persistDataset).not.toHaveBeenCalled();
    });

    it("saves the sample table as one dataset", async () => {
        const pdf = await readFile(samplePath);

        const res = await request(app)
            .post("/upload-pdf")
            .attach("file", pdf, { filename: "sample.pdf", contentType: "application/pdf" });

        expect(res.status).toBe(200);
        expect(res.body.data.datasetIds).toHaveLength(1);
        expect(res.body.data.datasetIds[0]).toMatch(/^[0-9a-f-]{36}$/);

        expect(persistDataset).toHaveBeenCalledTimes(1);
        const [, userId, filename, columns, rows] = vi.mocked(persistDataset).mock.calls[0]!;
        expect(userId).toBe("user-1");
        expect(filename).toBe("sample-table-1.csv");
        expect(columns).toEqual(sampleColumns);
        expect(rows).toHaveLength(5);
        expect(rows[1]).toEqual({
            "Student ID": "STU-002",
            Name: "Tunde Bello",
            Age: "NULL",
            Department: "Mathematics",
            Score: "74",
        });
    });

    it("saves each table as its own dataset", async () => {
        vi.mocked(extractTables).mockResolvedValueOnce([
            singleTable([["A", "B"], ["1", "2"]]),
            singleTable([["C", "D"], ["3", "4"]]),
        ]);
        const pdf = await readFile(samplePath);

        const res = await request(app)
            .post("/upload-pdf")
            .attach("file", pdf, { filename: "two.pdf", contentType: "application/pdf" });

        expect(res.status).toBe(200);
        expect(res.body.data.datasetIds).toHaveLength(2);
        expect(persistDataset).toHaveBeenCalledTimes(2);
        expect(vi.mocked(persistDataset).mock.calls[0]![2]).toBe("two-table-1.csv");
        expect(vi.mocked(persistDataset).mock.calls[1]![2]).toBe("two-table-2.csv");
    });

    it("returns 500 when saving fails", async () => {
        vi.spyOn(console, "error").mockImplementation(() => { });
        vi.mocked(persistDataset).mockRejectedValueOnce(new Error("db down"));
        const pdf = await readFile(samplePath);

        const res = await request(app)
            .post("/upload-pdf")
            .attach("file", pdf, { filename: "sample.pdf", contentType: "application/pdf" });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe("PDF dataset upload failed.");
    });
});

describe("POST /read-pdf", () => {
    it("returns 400 when no file is sent", async () => {
        const res = await request(app).post("/read-pdf");

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("No file uploaded.");
    });

    it("returns the page count and tables for sample.pdf", async () => {
        const pdf = await readFile(samplePath);

        const res = await request(app)
            .post("/read-pdf")
            .attach("file", pdf, { filename: "sample.pdf", contentType: "application/pdf" });

        expect(res.status).toBe(200);
        expect(res.body.pageCount).toBe(1);
        expect(res.body.tables).toHaveLength(1);
        expect(res.body.tables[0].rows[0]).toEqual(sampleColumns);
    });
});