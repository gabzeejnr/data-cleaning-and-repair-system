function parseNumericValue(value: unknown): number | null {
    if (typeof value !== "string" && typeof value !== "number") return null;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        let t = value.trim();

        const valid = /^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(t);
        if (!valid) return null;

        const n = t.replaceAll(",", "");

        return (Number.isFinite(Number(n))
            ? Number(n)
            : null
        );
    }
    return null;
}

function calculateMode(values: unknown[]): unknown {
    const freq = new Map<string, { value: unknown, count: number }>();

    for (const value of values) {
        const key = JSON.stringify(value);
        const existing = freq.get(key);

        if (existing) {
            existing.count++;
        } else {
            freq.set(key, { value, count: 1 })
        }
    }

    let mode: unknown;
    let highestCount = 0;

    for (const entry of freq.values()) {
        if (entry.count > highestCount) {
            highestCount = entry.count;
            mode = entry.value;
        }
    }

    return mode;
}

export { parseNumericValue, calculateMode }