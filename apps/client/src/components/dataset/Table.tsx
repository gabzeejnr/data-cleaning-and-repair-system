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
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="font-semibold text-slate-900">Data preview</h2>
                <p className="mt-1 text-sm text-slate-500">Review the records stored in this dataset.</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
                    <RefreshCw size={18} className="animate-spin text-indigo-600" />
                    Loading dataset...
                </div>
            ) : error ? (
                <div className="p-10 text-center">
                    <p className="font-medium text-red-600">{error}</p>
                    <button type="button" onClick={() => void getRows()} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                        Try again
                    </button>
                </div>
            ) : !rows?.length ? (
                <div className="p-12 text-center">
                    <Database size={32} className="mx-auto text-slate-300" />
                    <p className="mt-3 font-semibold text-slate-800">No records found</p>
                    <p className="mt-1 text-sm text-slate-500">This dataset doesn't contain any rows to preview.</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-max text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">S/N</th>
                                    {columns.map((column) => <th key={column} className="px-5 py-4 font-semibold">{column}</th>)}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {rows.map((row, index) => (
                                    <tr key={index} className="transition hover:bg-indigo-50/40">
                                        <td className="px-5 py-4 text-slate-400">{index + 1}</td>

                                        {columns.map((column) => (
                                            <td key={column} className="max-w-xs truncate px-5 py-4 text-slate-700"
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