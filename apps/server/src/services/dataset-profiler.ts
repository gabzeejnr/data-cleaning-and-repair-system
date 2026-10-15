import type { DatasetRow, DatasetProfile, ColumnProfile } from "../types/index.js";

function isMissing(value: unknown): boolean {
    return (
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
    );
}

function detectDataType(values: unknown[]): ColumnProfile["dataType"] {
    const presentValues = values.filter(value => !isMissing(value));

    if (presentValues.length === 0) return "empty";

    const types = new Set(
        presentValues.map((value) => {
            if (typeof value === "boolean") return "boolean";
            if (typeof value === "number" && Number.isFinite(value)) {
                return "number";
            }
            return "text";
        }),
    );

    if (types.size > 1) return "mixed";

    return (presentValues.every(value => (
        typeof value === "number" || (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)))
    )) ? "number" : (Array.from(types)[0] as ColumnProfile["dataType"]))
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

        return {
            name,
            dataType: detectDataType(values),
            missingCount,
            missingPercentage: rows.length === 0 ? 0 : (missingCount / rows.length) * 100,
            uniqueCount,
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

export { profileDataset }