function escapeCSV(value: unknown): string {
    if (value === null || value === undefined) return "";

    const s = String(value);

    return (/[",\r\n]/.test(s)
        ? `"${s.replace(/"/g, '""')}"`
        : s
    )
}




export { escapeCSV }