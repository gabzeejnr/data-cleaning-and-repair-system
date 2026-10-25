import { ArrowRight, Check, X } from "../../libs";
import { statusStyles } from "../../data";
import type { ProposedChange, ReviewStatus } from "../../types/repairs.types";
import type { SetStateAction } from "react";


function formatType(type: string) {
    return type.replaceAll("_", " ");
}

function displayValue(value: unknown) {
    if (value === null || value === undefined || value === "") {
        return "Missing value";
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
                                <h3 className="font-semibold text-slate-900">{change.column ?? "Duplicate row"}</h3>
                                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs capitalize text-slate-600">{formatType(change.type)}</span>
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                                Row {String(change.row_index)}
                                {change.method ? ` · Method: ${change.method}` : ""}
                            </p>
                        </div>

                        <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[status]}`}>{status}</span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                        <div className="min-w-0 rounded-xl border border-rose-100 bg-rose-50/60 p-4">
                            <p className="text-xs font-medium text-rose-700">Original value</p>
                            <p className="mt-2 break-words text-sm text-slate-800">{displayValue(change.original_value)}</p>
                        </div>

                        <ArrowRight size={18} className="hidden text-slate-400 md:block" />

                        <div className="min-w-0 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                            <p className="text-xs font-medium text-emerald-700">Proposed value</p>
                            <p className="mt-2 break-words text-sm text-slate-800">
                                {displayValue(change.proposed_value)}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                        <button type="button" onClick={() => decide(change.id, "rejected")}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-700"
                        >
                            <X size={16} />
                            Reject
                        </button>

                        <button type="button" onClick={() => decide(change.id, "accepted")}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
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