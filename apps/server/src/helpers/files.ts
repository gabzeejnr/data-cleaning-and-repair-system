function escapeCSV(value: unknown) {
    const v = value;

    if (v === null || v === undefined) return "";
    let s = String(v);

    if (s.includes('"')) {
        s = s.replace(/"/g, '""');
    }

    if (/[",\r\n]/.test(s)) {
        s = `"${s}"`;
    }
    return s;
}




export { escapeCSV }