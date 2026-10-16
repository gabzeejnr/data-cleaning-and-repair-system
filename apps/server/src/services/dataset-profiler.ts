import { isNumber } from "../libs/service.libs.js";
import type {
    DatasetRow, DatasetProfile, ColumnProfile, NumericStats,
    Outliers
} from "../types/index.js";
import { parseNumericValue } from "../utils/parsing.js";

function calculateNumericStats(values: unknown[]): NumericStats {
    const numbers = values.flatMap((value) => {
        if (typeof value === "number") {
            return Number.isFinite(value) ? [value] : [];
        }

        if (typeof value === "string" && value.trim() !== "") {
            const number = Number(value);
            return Number.isFinite(number) ? [number] : [];
        }

        return [];
    }).sort((a, b) => a - b);

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




// ================================================================================================
// UNEXPORTED ===================================
// ================================================================================================


function isMissing(value: unknown): boolean {
    return isNumber(value);
}

function detectDataType(values: unknown[]): ColumnProfile["dataType"] {
    const presentValues = values.filter(value => !isMissing(value));

    if (presentValues.length === 0) return "empty";

    const types = new Set(
        presentValues.map((value) => {
            if (typeof value === "boolean") return "boolean";
            if (isNumber(value)) {
                return "number";
            }
            return "text";
        }),
    );

    if (types.size > 1) return "mixed";

    return (presentValues.every(value => (isNumber(value)))
        ? "number"
        : (Array.from(types)[0] as ColumnProfile["dataType"])
    )
}

function calculateQuartiles(values: unknown[]): { Q1: number, Q3: number } | null {

    if (!values || values.length === 0) return null;

    const n = values.flatMap(value => {
        if (typeof value === "number") {
            return Number.isFinite(value) ? [value] : [];
        }

        if (typeof value === "string" && value.trim() !== "") {
            const number = Number(value);
            return Number.isFinite(number) ? [number] : []
        }

        return [];
    }).sort((a, b) => a - b);
    const length = n.length;
    if (length === 0) return null;
    if (length === 1) {
        if (n[0] === undefined) return null;
        return { Q1: n[0], Q3: n[0] }
    }

    let lowerHalf: number[] = [];
    let upperHalf: number[] = [];

    if (length % 2 !== 0) {
        lowerHalf.push(...n.slice(0, Math.floor(length / 2)));
        upperHalf.push(...n.slice(Math.ceil(length / 2)))
    } else {
        lowerHalf.push(...n.slice(0, length / 2));
        upperHalf.push(...n.slice((length / 2)))
    }


    const halfLength = lowerHalf.length;
    let Q1: number;
    let Q3: number;

    if (halfLength % 2 !== 0) {
        Q1 = lowerHalf[Math.floor(halfLength / 2)]!;
        Q3 = upperHalf[Math.floor(halfLength / 2)]!;
    } else {
        Q1 = (lowerHalf[(halfLength / 2) - 1]! + lowerHalf[halfLength / 2]!) / 2;
        Q3 = (upperHalf[(halfLength / 2) - 1]! + upperHalf[halfLength / 2]!) / 2;
    }

    return { Q1, Q3 }
}

function detectOutliers(values: unknown[]): Outliers | null {

    const qs = calculateQuartiles(values);
    if (qs === null) return null;

    const { Q1, Q3 } = qs;

    const IQR = Q3 - Q1;
    const lowerBound = Q1 - (1.5 * IQR);
    const upperBound = Q3 + (1.5 * IQR);

    const outliers = values.filter(value => {
        const n = Number(value);

        if (value === null
            || value === undefined
            || String(value).trim() === ""
            || !Number.isFinite(n)
        ) {
            return false;
        }

        const i = n < lowerBound || n > upperBound;

        return i
    })

    return {
        Q1,
        Q3,
        IQR,
        lowerBound,
        upperBound,
        outliers
    }
}