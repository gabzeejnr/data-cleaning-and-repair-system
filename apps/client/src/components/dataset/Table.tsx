import type { DatasetRow } from "@data-cleaning-system/shared";

export default function DatasetTable({ rows, columns }: { rows: DatasetRow[], columns: string[] }) {

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
    )
}