import { Columns3, Hash, Type, Calendar, CircleHelp } from "../../libs";
import type { ColumnProfile } from "@data-cleaning-system/shared";

interface ColumnProfileProps {
    columns: ColumnProfile[];
    loading?: boolean;
}

const typeStyles: Record<ColumnProfile["dataType"], string> = {
    text: "bg-brand-soft text-brand ring-brand/20",
    number: "bg-brand-soft text-brand ring-brand/20",
    boolean: "bg-success/10 text-success ring-success/20",
    mixed: "bg-warning/10 text-warning ring-warning/20",
    empty: "bg-bg-primary text-text-secondary ring-border",
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
        <section className="overflow-hidden rounded-2xl border border-border bg-bg-secondary shadow-sm">
            <div className="flex items-center gap-3 border-b border-border px-5 py-5 sm:px-6">
                <div className="rounded-xl bg-brand-soft p-2.5 text-brand">
                    <Columns3 size={20} />
                </div>

                <div>
                    <h2 className="font-semibold text-text-primary">Column profile</h2>
                    <p className="mt-1 text-sm text-text-secondary">Explore the structure and quality of each column.</p>
                </div>

                {!loading && (
                    <span className="ml-auto flex rounded-full bg-brand-soft px-3 py-1 text-center text-xs font-semibold text-brand">
                        {columns.length} columns
                    </span>
                )}
            </div>

            {loading ? (
                <div className="space-y-4 p-6">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="h-12 animate-pulse rounded-lg bg-bg-primary" />
                    ))}
                </div>
            ) : columns.length === 0 ? (
                <div className="px-6 py-12 text-center">
                    <Columns3 size={30} className="mx-auto text-text-secondary" />
                    <p className="mt-3 font-medium text-text-primary">No column profiles available</p>
                    <p className="mt-1 text-sm text-text-secondary">Column statistics will appear here once profiling is available.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-155 text-left text-sm">
                        <thead className="bg-bg-primary text-xs uppercase tracking-wide text-text-secondary">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Column name</th>
                                <th className="px-6 py-4 font-semibold">Data type</th>
                                <th className="px-6 py-4 text-right font-semibold">Missing values</th>
                                <th className="px-6 py-4 text-right font-semibold">Distinct values</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-border">
                            {columns.map((column) => {
                                const Icon = typeIcons[column.dataType];

                                return (
                                    <tr key={column.name} className="transition hover:bg-bg-primary">
                                        <td className="px-6 py-4 font-medium text-text-primary">{column.name}</td>

                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${typeStyles[column.dataType]}`}>
                                                <Icon size={13} />
                                                {column.dataType.capitalize()}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-right tabular-nums">
                                            <span className={(column.missingCount > 0
                                                ? "font-semibold text-warning"
                                                : "text-text-secondary"
                                            )}>{column.missingCount.toLocaleString()}</span>
                                        </td>

                                        <td className="px-6 py-4 text-right tabular-nums text-text-secondary">{column.uniqueCount.toLocaleString()}</td>
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