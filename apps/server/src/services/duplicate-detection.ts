import { normalizeValue } from "../helpers/index.js";
import type { DatasetRow } from "../types/dataset.type.js";

function findDuplicateGroups(rows: DatasetRow[], columns: string[]): DatasetRow[][] {

    const duplicates = new Map<string, DatasetRow[]>();
    for (const row of rows) {
        const hasMissingValue = columns.some(col => {
            const value = row[col];

            return (
                value === null || value === undefined
                || (
                    typeof value === "string"
                    && value.trim() === ""
                )
            )
        });

        if (hasMissingValue) continue;

        const key = JSON.stringify(columns.map(col => normalizeValue(row[col])));

        const group = duplicates.get(key) ?? [];
        group.push(row);
        duplicates.set(key, group);
    }

    return (Array.from(duplicates.values())
        .filter(dup => dup.length > 1)
    )
}

export { findDuplicateGroups }