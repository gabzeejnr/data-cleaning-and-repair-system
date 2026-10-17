import { isMissing } from "../helpers/index.js";
import { parseNumericValue, calculateMode } from "../utils/index.js";
import type { DatasetRow, RepairOptions, RepairResult } from "../types/index.js";

function preserveValueType(replacement: number, existingValues: unknown[]) {
    const firstValue = existingValues.find(v => v !== null && v !== undefined);

    return (typeof firstValue === "string"
        ? String(replacement)
        : replacement
    )
}

function decimalPlace(existingValues: unknown[]): number {
    const first = existingValues.find(v => v !== null && v !== undefined && v !== "");
    if (first === undefined) return 0;

    const stringed = String(first).trim();
    const decimalIndex = stringed.indexOf(".");

    return (decimalIndex === -1
        ? 0
        : stringed.length - decimalIndex - 1
    )
}

function repairMissingValues(rows: DatasetRow[], options: RepairOptions): RepairResult {
    const { column, strategy, fillValue } = options;

    if (rows.length === 0) throw new Error("Cannot repair an empty dataset");
    if (!Object.hasOwn(rows[0]!, column)) throw new Error(`Column "${column}" does not exist.`);

    const existingValues = (rows
        .map(row => row[column])
        .filter(value => !isMissing(value))
    )
    if (existingValues.length === 0 && strategy !== "constant") throw new Error(`Cannot use ${strategy}: column "${column}" has no existing values.`);
    const places = decimalPlace(existingValues)
    let replacementValue: unknown;

    switch (strategy) {
        case "mean": {
            const numbers = existingValues.map(parseNumericValue);
            if (numbers.some(v => v === null)) throw new Error(`Column "${column}" contains non-numeric values.`);

            const mean = numbers.reduce<number>((sum, value) => sum + value!, 0) / numbers.length;
            replacementValue = preserveValueType(Number(mean.toFixed(places)), existingValues)
            break;
        }
        case "median": {
            const numbers = existingValues.map(parseNumericValue);
            if (numbers.some(v => v === null)) throw new Error(`Column "${column}" contains non-numeric values.`);

            const sorted = (numbers
                .map(v => v!)
                .sort((a, b) => a - b)
            )

            const middle = Math.floor(sorted.length / 2);
            const median = (sorted.length % 2 === 0
                ? (sorted[middle - 1]! + sorted[middle]!) / 2
                : sorted[middle]
            )

            replacementValue = preserveValueType(Number(median!.toFixed(places)), existingValues)
            break;
        }
        case "mode": {
            replacementValue = calculateMode(existingValues);
            if (replacementValue === undefined) throw new Error(`Could not calculate mode for "${column}"`);
            break;
        }
        case "constant": {
            if (fillValue === undefined || fillValue === null) throw new Error(`A non-null fillValue is required for constant replacement.`);
            replacementValue = fillValue;
            break;
        }
    }

    const repairedCount = (rows
        .filter(row => isMissing(row[column])
        ).length
    )

    const repairedRows = rows.map(row => {
        const d = {
            ...row,
            ...(isMissing(row[column]))
                ? { [column]: replacementValue }
                : {}
        }

        return d;
    })

    return {
        rows: repairedRows,
        column,
        strategy,
        replacementValue,
        repairedCount
    }
}

export { repairMissingValues }