import { useEffect, useMemo, useState } from "react";
import { API } from "../apis/axios";
import { AlertTriangle, FileText } from "../libs";
import RunDetail from "../components/reports/RunDetail";
import { summarizeRuns } from "../utils/reportSummary";
import type { CleaningRun } from "../types/reports.types";
import { reportsLabels } from "../data";

export default function Reports() {
    const [runs, setRuns] = useState<CleaningRun[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [datasetFilter, setDatasetFilter] = useState("all")
    const [selectedId, setSelectedId] = useState<string | null>(null)

    useEffect(() => {
        let active = true;

        API.get<{ data: CleaningRun[] }>("/datasets/reports")
            .then(({ data }) => active && setRuns(data.data))
            .catch(() => active && setError("Couldn't load reports. Please try again."))
            .finally(() => active && setLoading(false));

        return () => { active = false }
    }, [])

    const datasets = useMemo(() => Array.from(
        new Map(
            runs.map(run => [run.datasetId, run.datasetName])
        ).entries()
    ), [runs])

    const visible = useMemo(() => runs.filter(
        run => datasetFilter === "all"
            || run.datasetId === datasetFilter
    ), [runs, datasetFilter])

    const stats = useMemo(() => summarizeRuns(visible), [visible]);
    const selected = visible.find(run => run.id === selectedId) ?? null;

    return (
        <main className="space-y-6 pb-10">
            <header className="rounded-2xl bg-ink p-6 text-white sm:p-8">
                <div className="flex items-center gap-2 text-sm font-medium text-brand-soft">
                    <FileText size={17} /> Cleaning history
                </div>
                <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Reports</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">Every approved repair, with what changed and how it was done.</p>
            </header>

            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {reportsLabels(stats).map(({ label, value, icon: Icon }) => (
                    <article key={label} className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-muted sm:text-sm">{label}</span>
                            <span className="rounded-lg bg-brand-soft p-2 text-brand"><Icon size={18} /></span>
                        </div>
                        <p className="mt-4 text-2xl font-bold tabular-nums text-ink">{value.toLocaleString()}</p>
                    </article>
                ))}
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-mist p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        <h2 className="font-semibold text-ink">Runs</h2>
                        <select value={datasetFilter} onChange={e => setDatasetFilter(e.target.value)}
                            className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/20"
                        >
                            <option value="all">All datasets</option>
                            {datasets.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                        </select>
                    </div>

                    {loading
                        ? (<div className="space-y-3 p-6">
                            {[0, 1, 2].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-mist" />)}
                        </div>)
                        : (error
                            ? (<p role="alert" className="flex items-center gap-2 p-6 text-sm text-rose-600">
                                <AlertTriangle size={17} /> {error}
                            </p>)
                            : (visible.length === 0
                                ? (<div className="px-6 py-14 text-center">
                                    <p className="font-semibold text-ink">No reports yet</p>
                                    <p className="mt-2 text-sm text-muted">Approve and apply repairs to see them here.</p>
                                </div>)
                                : (<ul className="divide-y divide-mist">
                                    {visible.map(run => (<li key={run.id}>
                                        <button type="button" onClick={() => setSelectedId(run.id)} aria-pressed={run.id === selectedId}
                                            className={`grid w-full gap-2 px-5 py-4 text-left transition sm:grid-cols-[1fr_auto] sm:items-center sm:px-6 ${run.id === selectedId ? "bg-brand-soft" : "hover:bg-mist"}`}
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium text-ink">{run.datasetName}</span>
                                                <span className="text-xs text-muted">
                                                    {new Date(run.createdAt).toLocaleDateString()} · {run.rowsBefore.toLocaleString()} → {run.rowsAfter.toLocaleString()} rows
                                                </span>
                                            </span>
                                            <span className="flex flex-wrap gap-1.5">
                                                {run.breakdown.slice(0, 3).map(item => (
                                                    <span key={item.errorType} className="rounded-md bg-white px-2 py-1 text-xs text-muted ring-1 ring-line">
                                                        {item.recordsAffected.toLocaleString()} {item.errorType.replaceAll("_", " ")}
                                                    </span>
                                                ))}
                                            </span>
                                        </button>
                                    </li>
                                    ))}
                                </ul>
                                )
                            )
                        )
                    }
                </section>

                <div className="xl:sticky xl:top-6 xl:self-start">
                    {selected
                        ? <RunDetail run={selected} onClose={() => setSelectedId(null)} />
                        : <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
                            Select a run to see what changed.
                        </div>
                    }
                </div>
            </div>
        </main>
    )
}