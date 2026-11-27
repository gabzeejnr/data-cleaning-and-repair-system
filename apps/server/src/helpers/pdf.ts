import { COLUMN_TOLERANCE, MIN_COLUMNS, MIN_ROWS, LINE_TOLERANCE, CELL_GAP, MAX_ROW_GAP } from "../libs/index.js";
import { escapeCSV } from "./files.js";
import type { DatasetRow } from "@data-cleaning-system/shared"
import type { Cell, ExtractedPDFPage, ExtractedTextItem, PDFTable, Line } from "../types/pdf.types.js";


function detectTables(pages: ExtractedPDFPage[]): PDFTable[] {
    const tables: PDFTable[] = [];

    for (const page of pages) {
        const lines = buildLines(page.items);

        for (const block of groupIntoBlocks(lines)) {
            const columnStarts = clusterCoordinates(
                block
                    .filter(line => line.cells.length >= 2)
                    .flatMap(line => line.cells.map(cell => cell.x)),
                COLUMN_TOLERANCE
            );

            if (columnStarts.length < MIN_COLUMNS) continue;

            const rows = buildRows(block, columnStarts);
            if (rows.length < MIN_ROWS) continue;

            tables.push({ pageNumber: page.pageNumber, columnStarts, rows });
        }
    }

    return tables;
}

function tableToCSV(table: PDFTable): string {
    return table.rows
        .map(row => row.map(escapeCSV).join(","))
        .join("\n");
}

function tableToRecords(table: PDFTable): { columns: string[]; rows: DatasetRow[] } {
    const headerRow = table.rows[0] ?? [];
    const seen = new Map<string, number>();

    const columns = headerRow.map((raw, index) => {
        const base = raw.trim() || `column_${index + 1}`;
        const count = (seen.get(base) ?? 0) + 1;
        seen.set(base, count);
        return count === 1 ? base : `${base}_${count}`;
    });

    const rows: DatasetRow[] = [];

    for (const cells of table.rows.slice(1)) {
        if (cells.every(cell => cell.trim() === "")) continue;

        const record: DatasetRow = {};
        columns.forEach((column, index) => {
            const value = (cells[index] ?? "").trim();
            record[column] = value === "" ? null : value;
        });
        rows.push(record);
    }

    return { columns, rows };
}


export { detectTables, tableToCSV, tableToRecords }

function buildLines(items: ExtractedTextItem[]): Line[] {
    const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
    const groups: { y: number; items: ExtractedTextItem[] }[] = [];

    for (const item of sorted) {
        const last = groups[groups.length - 1];

        if (last && Math.abs(last.y - item.y) <= LINE_TOLERANCE) {
            last.items.push(item);
        } else {
            groups.push({ y: item.y, items: [item] });
        }
    }

    return groups.map(({ y, items }) => ({
        y,
        cells: mergeIntoCells(items.sort((a, b) => a.x - b.x))
    }));
}

function mergeIntoCells(items: ExtractedTextItem[]): Cell[] {
    const cells: { x: number; end: number; parts: string[] }[] = [];

    for (const item of items) {
        const last = cells[cells.length - 1];

        if (last && item.x - last.end < CELL_GAP) {
            last.parts.push(item.text.trim());
            last.end = item.x + item.width;
        } else {
            cells.push({
                x: item.x,
                end: item.x + item.width,
                parts: [item.text.trim()]
            });
        }
    }

    return cells.map(cell => ({ x: cell.x, end: cell.end, text: cell.parts.join(" ") }));
}


function groupIntoBlocks(lines: Line[]): Line[][] {
    const blocks: Line[][] = [];
    let current: Line[] = [];

    for (const line of lines) {
        const previous = current[current.length - 1];
        const isNear = previous !== undefined && previous.y - line.y <= MAX_ROW_GAP;

        if (current.length && isNear) {
            current.push(line);
        } else {
            if (current.length) blocks.push(current);
            current = line.cells.length >= 2 ? [line] : [];
        }
    }

    if (current.length) blocks.push(current);

    return blocks;
}


function clusterCoordinates(values: number[], tolerance: number): number[] {
    const sorted = [...values].sort((a, b) => a - b);
    const starts: number[] = [];
    let group: number[] = [];

    for (const value of sorted) {
        if (group.length && value - group[group.length - 1]! > tolerance) {
            starts.push(group[0]!);
            group = [];
        }
        group.push(value);
    }

    if (group.length) starts.push(group[0]!);

    return starts;
}

function columnIndex(x: number, columnStarts: number[]): number {
    let index = 0;

    for (let i = 0; i < columnStarts.length; i++) {
        if (x + COLUMN_TOLERANCE >= columnStarts[i]!) index = i;
    }

    return index;
}

function buildRows(block: Line[], columnStarts: number[]): string[][] {
    const rows: string[][] = [];

    for (const line of block) {
        const row = new Array<string>(columnStarts.length).fill("");

        for (const cell of line.cells) {
            const col = columnIndex(cell.x, columnStarts);
            row[col] = row[col] ? `${row[col]} ${cell.text}` : cell.text;
        }

        const isAlignedContinuation = line.cells.every(cell => {
            const col = columnIndex(cell.x, columnStarts);
            return col > 0 && Math.abs(cell.x - columnStarts[col]!) <= COLUMN_TOLERANCE;
        });

        if (isAlignedContinuation && rows.length > 0) {
            const previous = rows[rows.length - 1]!;
            row.forEach((text, i) => {
                if (text) previous[i] = previous[i] ? `${previous[i]} ${text}` : text;
            });
            continue;
        }

        const isProse =
            line.cells.length === 1 &&
            columnStarts.length > 1 &&
            line.cells[0]!.end > columnStarts[1]!;

        if (isProse) break;

        const startsRow = line.cells.some(cell => columnIndex(cell.x, columnStarts) === 0);

        if (startsRow || rows.length === 0) {
            rows.push(row);
            continue;
        }
        break;
    }
    return rows;
}