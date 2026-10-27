function countMissingValues(records: Record<string, unknown>[]): number {
    return records.reduce((t, r) => {
        const row = (r.row_data
            && typeof r.row_data === "object"
            && !Array.isArray(r.row_data)
            ? (r.row_data as Record<string, unknown>)
            : r
        )

        return (
            t +
            Object.values(row).filter(v =>
                v === null ||
                v === undefined ||
                (typeof v === "string" && v.trim() === "")
            ).length
        )
    }, 0)
}



export { countMissingValues }