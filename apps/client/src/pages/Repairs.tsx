import { useEffect, useMemo, useState } from "react";
import { API, ML_API } from "../apis/axios";
import { repairStats, status } from "../data";
import {
    AlertTriangle, ArrowRight,
    CheckCheck, FileCheck2,
    RefreshCw, Sparkles
} from "../libs";
import DatasetSelector from "../components/datasets/DatasetSelector";
import type { Dataset } from "@data-cleaning-system/shared";
import type { ProposedChange, ReviewStatus } from "../types/repairs.types";
import RepairsHeader from "../components/repairs/RepairsHeader";
import VisibleChanges from "../components/repairs/VisibleChanges";


export default function Repairs() {
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [selectedDatasetId, setSelectedDatasetId] = useState("");
    const [changes, setChanges] = useState<ProposedChange[]>([]);
    const [decisions, setDecisions] = useState<Record<string, ReviewStatus>>({});
    const [filter, setFilter] = useState<"all" | ReviewStatus>("all");
    const [loadingDatasets, setLoadingDatasets] = useState(true);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [error, setError] = useState("");
    const [hasPreview, setHasPreview] = useState(false);
    const [previewToken, setPreviewToken] = useState<string | null>(null);
    const [applyLoading, setApplyLoading] = useState(false);
    const [success, setSuccess] = useState("");

    useEffect(() => {
        let active = true;

        async function loadDatasets() {
            try {
                const response = await API.get<{ data: Dataset[] }>("/datasets");
                if (!active) return;

                setDatasets(response.data.data);
                setSelectedDatasetId(response.data.data[0]?.id ?? "");
            } catch {
                if (active) {
                    setError("Couldn't load your datasets. Please try again.");
                }
            } finally {
                if (active) setLoadingDatasets(false);
            }
        }

        void loadDatasets();

        return () => {
            active = false;
        };
    }, []);

    interface DatasetRow {
        id: string;
        dataset_id: string;
        row_index: number;
        row_data: Record<string, unknown>
    }


    async function generatePreview() {
        if (!selectedDatasetId) return;

        setPreviewLoading(true);
        setError("");
        setHasPreview(false);
        setPreviewToken(null);
        setSuccess("");

        try {
            const { data } = await API.get(
                `/datasets/${selectedDatasetId}/rows`
            );

            const records: DatasetRow["row_data"][] =
                data.data.map((row: DatasetRow) => row.row_data);

            const res = await ML_API.post("/clean/preview", { records });

            const preview = res.data;

            setPreviewToken(preview.preview_token);
            setChanges(preview.changes);
            setHasPreview(true);
            setDecisions({});
            setFilter("all");
        } catch (err) {
            console.error(err);
            setError("Couldn't generate the preview. Please try again.");
        } finally {
            setPreviewLoading(false);
        }
    }

    async function applyApprovedChanges() {
        if (!previewToken || !selectedDatasetId) return;

        const acceptedChangeIds = Object.entries(decisions)
            .filter(([, decision]) => decision === "accepted")
            .map(([id]) => id);

        if (acceptedChangeIds.length === 0) return;

        setApplyLoading(true);
        setError("");
        setSuccess("");

        try {
            const { data: applied } = await ML_API.post("/clean/apply", {
                preview_token: previewToken,
                accepted_change_ids: acceptedChangeIds,
            });

            const { data: saved } = await API.post("/datasets/save-repairs", {
                datasetId: selectedDatasetId,
                records: applied.cleaned_records,
            });

            setPreviewToken(null);
            setHasPreview(false);
            setChanges([]);
            setDecisions({});

            setSuccess(
                `Repaired dataset saved successfully. ${saved.data.rowCount} rows saved.`
            );
        } catch (err) {
            console.error(err);
            setError("Couldn't apply and save the repairs. Please try again.");
        } finally {
            setApplyLoading(false);
        }
    }


    function selectDataset(datasetId: string) {
        setSelectedDatasetId(datasetId);
        setChanges([]);
        setDecisions({});
        setHasPreview(false);
        setError("");
        setPreviewToken(null);
        setSuccess("");
    }



    const visibleChanges = changes.filter(change => {
        const status = decisions[change.id] ?? "pending";
        return filter === "all" || status === filter;
    })

    const counts = useMemo(() => {
        return {
            total: changes.length,
            pending: changes.filter(c => (decisions[c.id] ?? "pending") === "pending").length,
            accepted: changes.filter(c => decisions[c.id] === "accepted").length,
            rejected: changes.filter(c => decisions[c.id] === "rejected").length,
        }
    }, [changes, decisions]);

    return (
        <main className="space-y-7 pb-10">
            <RepairsHeader />

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4">
                    <h2 className="font-semibold text-slate-900">Choose a dataset</h2>
                    <p className="mt-1 text-sm text-slate-500">Select the dataset you want to clean.</p>
                </div>

                {loadingDatasets ? (
                    <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
                ) : datasets.length > 0 ? (
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                        <div className="min-w-0 flex-1">
                            <DatasetSelector datasets={datasets} value={selectedDatasetId}
                                onChange={selectDataset} disabled={previewLoading}
                            />
                        </div>

                        <button type="button" onClick={generatePreview} disabled={!selectedDatasetId || previewLoading}
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {previewLoading
                                ? <RefreshCw size={17} className="animate-spin" />
                                : <Sparkles size={17} />
                            }
                            Generate preview
                            {!previewLoading && <ArrowRight size={17} />}
                        </button>
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                        <FileCheck2 className="mx-auto text-slate-400" size={28} />
                        <p className="mt-3 font-medium text-slate-800">No datasets available</p>
                        <p className="mt-1 text-sm text-slate-500">Upload a dataset before starting a repair.</p>
                    </div>
                )}

                {error && (
                    <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-rose-600">
                        <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                        {error}
                    </p>
                )}
                {success && (
                    <p role="status" className="mt-4 text-sm font-medium text-emerald-600">{success}</p>
                )}
            </section>

            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {repairStats(counts).map(stat => {
                    const Icon = stat.icon;

                    return (
                        <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-medium text-slate-500 sm:text-sm">{stat.label}</span>
                                <span className={`rounded-lg p-2 ${stat.color}`}>
                                    <Icon size={18} />
                                </span>
                            </div>

                            <p className="mt-4 text-2xl font-bold text-slate-900">{stat.value}</p>
                        </article>
                    )
                })}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
                    <div>
                        <h2 className="font-semibold text-slate-900">Proposed changes</h2>
                        <p className="mt-1 text-sm text-slate-500">Compare original values with the suggested corrections.</p>
                    </div>

                    <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
                        {status.map(option => (
                            <button key={option} type="button" onClick={() => setFilter(option)}
                                className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition ${filter === option
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                                    }`
                                }
                            >{option}</button>
                        ))}
                    </div>
                </div>

                {!hasPreview ? (
                    <div className="px-6 py-14 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                            <Sparkles size={26} />
                        </div>
                        <h3 className="mt-4 font-semibold text-slate-900">Ready to review your data?</h3>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                            Choose a dataset above and generate a preview. Proposed corrections will appear here for your approval.
                        </p>
                    </div>
                ) : visibleChanges.length === 0
                    ? <div className="px-6 py-12 text-center text-sm text-slate-500">No changes match this filter.</div>
                    : <div className="divide-y divide-slate-100">
                        <VisibleChanges visibleChanges={visibleChanges} decisions={decisions} setDecisions={setDecisions} />
                    </div>
                }

                <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-sm text-slate-500">{counts.accepted} changes approved</p>

                    <button type="button" onClick={applyApprovedChanges} disabled={!hasPreview
                        || !previewToken
                        || counts.accepted === 0
                        || applyLoading
                    } className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {applyLoading
                            ? <RefreshCw size={17} className="animate-spin" />
                            : <CheckCheck size={17} />
                        }
                        {applyLoading ? "Applying changes..." : "Apply approved changes"}
                    </button>
                </div>
            </section>
        </main>
    );
}
