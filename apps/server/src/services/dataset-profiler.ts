import type { ColumnProfile } from "../types/dataset.type.js";

function isMissing(value: unknown): boolean {
        return (
            value === null ||
            value === undefined ||
            (typeof value === "string" && value.trim() === "")
        );
    }

function detectDataType(values: unknown) { }