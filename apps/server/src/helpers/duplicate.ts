import { parseNumericValue } from "../utils/index.js";

function normalizeValue(value: unknown): unknown {
    if (typeof value === "string") {
        const t = value.trim();
        const n = parseNumericValue(t);

        return n ?? t;
    }

    return value;
}

export { normalizeValue }