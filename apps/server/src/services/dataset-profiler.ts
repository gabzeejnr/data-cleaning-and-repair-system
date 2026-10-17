import { findDuplicateGroups } from "./duplicate-detection.js";
import { isMissing, detectDataType, detectOutliers } from "../helpers/index.js";
import { parseNumericValue } from "../utils/index.js";
import type { DatasetRow, DatasetProfile, ColumnProfile, NumericStats } from "../types/index.js";

function calculateNumericStats(values: unknown[]): NumericStats {
    const numbers = (values
        .flatMap((value) => {
            const n = parseNumericValue(value);
            return n !== null ? [n] : []
        })
        .sort((a, b) => a - b)
    )

    if (numbers.length === 0) {
        return { count: 0, mean: null, median: null, min: null, max: null };
    }

    const total = numbers.reduce((sum, number) => sum + number, 0);
    const middle = Math.floor(numbers.length / 2);
    const median = numbers.length % 2 === 0
        ? (numbers[middle - 1]! + numbers[middle]!) / 2
        : numbers[middle]!;

    return {
        count: numbers.length,
        mean: total / numbers.length,
        median,
        min: numbers[0]!,
        max: numbers[numbers.length - 1]!,
    };
}

function profileDataset(rows: DatasetRow[]): DatasetProfile {
    const columnNames = Array.from(
        new Set(rows.flatMap((row) => Object.keys(row))),
    );

    const columns = columnNames.map((name): ColumnProfile => {
        const values = rows.map((row) => row[name]);
        const missingCount = values.filter(isMissing).length;

        const uniqueCount = new Set(
            values.filter((value) => !isMissing(value)).map((value) =>
                typeof value === "string" ? value.trim() : JSON.stringify(value),
            ),
        ).size;

        const dataType = detectDataType(values);

        const numericStats = (dataType === "number"
            ? calculateNumericStats(values)
            : undefined
        )

        const outlierAnalysis = dataType === "number"
            ? detectOutliers(values)
            : undefined

        return {
            name,
            dataType,
            missingCount,
            missingPercentage: rows.length === 0 ? 0 : (missingCount / rows.length) * 100,
            uniqueCount,
            ...(numericStats !== undefined && { numericStats }),
            ...(outlierAnalysis !== undefined && { outlierAnalysis })
        };
    });

    const seenRows = new Set<string>();
    let duplicateRows = 0;

    for (const row of rows) {
        const rowKey = JSON.stringify(
            columnNames.map((name) => row[name] ?? null),
        );

        if (seenRows.has(rowKey)) {
            duplicateRows++;
        } else {
            seenRows.add(rowKey);
        }
    }

    const possibleDuplicates = findDuplicateGroups(rows, ["name"])

    return {
        rowCount: rows.length,
        columnCount: columnNames.length,
        duplicateRows,
        totalMissingValues: columns.reduce(
            (total, column) => total + column.missingCount,
            0,
        ),
        columns,
    };
}

export { calculateNumericStats, profileDataset }