import { Database, RefreshCw } from "../../libs";
import type { DatasetRow } from "@data-cleaning-system/shared";

interface DatasetTableProps {
    rows: DatasetRow[] | null,
    columns: string[],
    loading: boolean,
    error: string | null,
    getRows(): void
}

export default function DatasetTable({ rows, columns, loading, error, getRows }: DatasetTableProps) {

    function formatCell(value: unknown): string {
        if (value === null || value === undefined || value === "") {
            return "—";
        }

        if (typeof value === "object") {
            return JSON.stringify(value);
        }

        return String(value);
    }


    return (
        <section className="overflow-hidden rounded-2xl border border-border bg-bg-secondary shadow-sm">
            <div className="border-b border-border px-5 py-4 sm:px-6">
                <h2 className="font-semibold text-text-primary">Data preview</h2>
                <p className="mt-1 text-sm text-text-secondary">Review the records stored in this dataset.</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center gap-3 p-12 text-sm text-text-secondary">
                    <RefreshCw size={18} className="animate-spin text-brand" />
                    Loading dataset...
                </div>
            ) : error ? (
                <div className="p-10 text-center">
                    <p className="font-medium text-danger">{error}</p>
                    <button type="button" onClick={() => void getRows()} className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">
                        Try again
                    </button>
                </div>
            ) : !rows?.length ? (
                <div className="p-12 text-center">
                    <Database size={32} className="mx-auto text-text-secondary" />
                    <p className="mt-3 font-semibold text-text-primary">No records found</p>
                    <p className="mt-1 text-sm text-text-secondary">This dataset doesn't contain any rows to preview.</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-max text-left text-sm">
                            <thead className="bg-bg-primary text-xs uppercase tracking-wide text-text-secondary">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">S/N</th>
                                    {columns.map((column) => <th key={column} className="px-5 py-4 font-semibold">{column}</th>)}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-border">
                                {rows.map((row, index) => (
                                    <tr key={index} className="transition hover:bg-bg-primary">
                                        <td className="px-5 py-4 text-text-secondary">{index + 1}</td>

                                        {columns.map((column) => (
                                            <td key={column} className="max-w-xs truncate px-5 py-4 text-text-primary"
                                                title={formatCell((row)[column])}
                                            >
                                                {formatCell((row)[column])}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </section>
    )
}