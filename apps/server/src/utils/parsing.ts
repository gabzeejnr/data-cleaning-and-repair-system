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

export { parseNumericValue }