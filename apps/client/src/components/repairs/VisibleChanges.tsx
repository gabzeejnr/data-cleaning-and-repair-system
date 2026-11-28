import { ArrowRight, Check, X } from "../../libs";
import { statusStyles } from "../../data";
import type { ProposedChange, ReviewStatus } from "../../types/repairs.types";
import type { SetStateAction } from "react";


function formatType(type: string) {
    return type.replaceAll("_", " ");
}

function displayValue(value: unknown) {
    if (value === null || value === undefined || value === "") {
        return "—";
    }

    if (typeof value === "object") {
        return JSON.stringify(value);
    }

    return String(value);
}


export default function VisibleChanges({ visibleChanges, decisions, setDecisions }: {
    visibleChanges: ProposedChange[];
    decisions: Record<string, ReviewStatus>;
    setDecisions: React.Dispatch<SetStateAction<typeof decisions>>
}) {

    function decide(id: string, status: ReviewStatus) {
        setDecisions(current => ({ ...current, [id]: status }));
    }

    return (
        visibleChanges.map(change => {
            const status = decisions[change.id] ?? "pending";

            return (
                <article key={change.id} className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-text-primary">{change.column ?? "Duplicate row"}</h3>
                                <span className="rounded-md bg-bg-primary px-2 py-1 text-xs capitalize text-text-secondary">{formatType(change.type)}</span>
                            </div>

                            <p className="mt-1 text-xs text-text-secondary">
                                Row {String(change.row_index)}
                                {change.method ? ` · Method: ${change.method}` : ""}
                            </p>
                        </div>

                        <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[status]}`}>{status}</span>
                    </div>


                    {change.type === "outlier_review" ? (
                        <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-4">
                            <p className="text-sm font-semibold text-warning">
                                Unusual row detected
                            </p>

                            <p className="mt-2 text-sm text-warning">
                                Anomaly score: {change.details?.anomaly_score ?? "Unavailable"}
                            </p>

                            <p className="mt-2 text-sm text-warning">
                                No automatic replacement is proposed. Review this row in the
                                dataset before deciding whether it needs correction.
                            </p>

                            <p className="mt-2 text-xs text-warning">
                                Numeric columns analyzed:{" "}
                                {change.details?.numeric_columns.join(", ") || "None"}
                            </p>
                        </div>
                    ) : (
                        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                            <div className="min-w-0 rounded-xl border border-danger/20 bg-danger/10 p-4">
                                <p className="text-xs font-medium text-danger">Original value</p>
                                <p className="mt-2 wrap-break-word text-sm text-text-primary">
                                    {displayValue(change.original_value)}
                                </p>
                            </div>

                            <ArrowRight size={18} className="hidden text-text-secondary md:block" />

                            <div className="min-w-0 rounded-xl border border-success/20 bg-success/10 p-4">
                                <p className="text-xs font-medium text-success">Proposed value</p>
                                <p className="mt-2 wrap-break-word text-sm text-text-primary">
                                    {displayValue(change.proposed_value)}
                                </p>
                            </div>
                        </div>
                    )}


                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                        <button type="button" onClick={() => decide(change.id, "rejected")}
                            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary transition hover:bg-danger/10 hover:text-danger"
                        >
                            <X size={16} />
                            Reject
                        </button>

                        <button type="button" onClick={() => decide(change.id, "accepted")}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-hover"
                        >
                            <Check size={16} />
                            Accept
                        </button>
                    </div>
                </article>
            )
        })
    )
}