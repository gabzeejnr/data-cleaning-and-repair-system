import { Columns3, Hash, Type, Calendar, CircleHelp } from "../../libs";
import type { ColumnProfile } from "@data-cleaning-system/shared";

interface ColumnProfileProps {
    columns: ColumnProfile[];
    loading?: boolean;
}

const typeStyles: Record<ColumnProfile["dataType"], string> = {
    text: "bg-sky-50 text-sky-700 ring-sky-600/20",
    number: "bg-violet-50 text-violet-700 ring-violet-600/20",
    boolean: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    mixed: "bg-amber-50 text-amber-700 ring-amber-600/20",
    empty: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const typeIcons = {
    text: Type,
    number: Hash,
    boolean: CircleHelp,
    mixed: Calendar,
    empty: CircleHelp,
};

export default function ColumnProfile({ columns, loading = false }: ColumnProfileProps) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
                <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                    <Columns3 size={20} />
                </div>

                <div>
                    <h2 className="font-semibold text-slate-900">Column profile</h2>
                    <p className="mt-1 text-sm text-slate-500">Explore the structure and quality of each column.</p>
                </div>

                {!loading && (
                    <span className="ml-auto rounded-full bg-indigo-50 px-3 py-1 text-xs text-center flex  font-semibold text-indigo-700">
                        {columns.length} columns
                    </span>
                )}
            </div>

            {loading ? (
                <div className="space-y-4 p-6">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                </div>
            ) : columns.length === 0 ? (
                <div className="px-6 py-12 text-center">
                    <Columns3 size={30} className="mx-auto text-slate-300" />
                    <p className="mt-3 font-medium text-slate-800">No column profiles available</p>
                    <p className="mt-1 text-sm text-slate-500">Column statistics will appear here once profiling is available.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Column name</th>
                                <th className="px-6 py-4 font-semibold">Data type</th>
                                <th className="px-6 py-4 text-right font-semibold">Missing values</th>
                                <th className="px-6 py-4 text-right font-semibold">Distinct values</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {columns.map((column) => {
                                const Icon = typeIcons[column.dataType];

                                return (
                                    <tr key={column.name} className="transition hover:bg-indigo-50/40">
                                        <td className="px-6 py-4 font-medium text-slate-800">{column.name}</td>

                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${typeStyles[column.dataType]}`}>
                                                <Icon size={13} />
                                                {column.dataType.capitalize()}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-right tabular-nums">
                                            <span className={(column.missingCount > 0
                                                ? "font-semibold text-amber-600"
                                                : "text-slate-500"
                                            )}>{column.missingCount.toLocaleString()}</span>
                                        </td>

                                        <td className="px-6 py-4 text-right tabular-nums text-slate-600">{column.uniqueCount.toLocaleString()}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    )
}