import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API, ML_API } from "../apis/axios";
import { repairStats, status } from "../data";
import { AlertTriangle, ArrowRight, FileCheck2, RefreshCw, Sparkles } from "../libs";
import DatasetSelector from "../components/datasets/DatasetSelector";
import RepairsHeader from "../components/repairs/RepairsHeader";
import ChangeGroupCard from "../components/repairs/ChangeGroupCard";
import ReviewActionBar from "../components/repairs/ReviewActionBar";
import { groupChanges, isApplyable, summarize } from "../utils/groupChanges";
import type { Dataset, CleaningReportInput } from "@data-cleaning-system/shared";
import type { ProposedChange, ReviewStatus } from "../types/repairs.types";


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

    const visibleChanges = useMemo(() => changes.filter(change => {
        const decision = decisions[change.id] ?? "pending";
        return filter === "all" || decision === filter;
    }), [changes, decisions, filter]);

    const counts = useMemo(() => {
        return {
            total: changes.length,
            pending: changes.filter(c => (decisions[c.id] ?? "pending") === "pending").length,
            accepted: changes.filter(c => decisions[c.id] === "accepted").length,
            rejected: changes.filter(c => decisions[c.id] === "rejected").length,
        }
    }, [changes, decisions]);

    const groups = useMemo(() => groupChanges(visibleChanges), [visibleChanges]);
    const stats = useMemo(() => summarize(changes, decisions), [changes, decisions]);

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

    function decide(id: string, status: ReviewStatus) {
        setDecisions(current => ({ ...current, [id]: status }));
    }

    function decideAll(ids: string[], status: ReviewStatus) {
        setDecisions(current => ({
            ...current,
            ...Object.fromEntries(ids.map(id => [id, status])),
        }));
    }

    function buildCleaningReports(changes: ProposedChange[], appliedChangeIds: string[], rowsRemoved: number): CleaningReportInput[] {
        const appliedIds = new Set(appliedChangeIds);

        const grouped = new Map<string, {
            rows: Set<string>;
            methods: Set<string>;
        }>();

        for (const change of changes) {
            if (!appliedIds.has(change.id)) continue;

            const group = grouped.get(change.type) ?? {
                rows: new Set<string>(),
                methods: new Set<string>(),
            };

            group.rows.add(String(change.row_index));
            group.methods.add(change.method || "repair_applied");

            grouped.set(change.type, group);
        }

        const reports: CleaningReportInput[] = Array.from(
            grouped,
            ([errorType, group]) => ({
                errorType,
                recordsAffected: group.rows.size,
                actionTaken: Array.from(group.methods).join(", "),
            })
        );

        if (rowsRemoved > 0) {
            reports.push({
                errorType: "duplicate_rows",
                recordsAffected: rowsRemoved,
                actionTaken: "Removed duplicate rows",
            });
        }

        return reports;
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
            console.error("Preview generation failed:", err);

            if (axios.isAxiosError(err)) {
                console.error("Status:", err.response?.status);
                console.error("Response:", err.response?.data);
            }

            setError("Couldn't generate preview. Check the console for details.");
        } finally {
            setPreviewLoading(false);
        }
    }

    async function applyApprovedChanges() {
        if (!previewToken || !selectedDatasetId) return;

        const applyable = changes.filter(isApplyable);
        const acceptedChangeIds = applyable
            .filter(change => decisions[change.id] === "accepted")
            .map(change => change.id);

        if (acceptedChangeIds.length === 0) return;

        setApplyLoading(true);
        setError("");
        setSuccess("");

        try {
            const { data: applied } = await ML_API.post("/clean/apply", {
                preview_token: previewToken,
                accepted_change_ids: acceptedChangeIds,
            });

            const reports = buildCleaningReports(
                changes,
                applied.applied_change_ids,
                applied.rows_removed
            );

            const { data: saved } = await API.post("/datasets/save-repairs", {
                datasetId: selectedDatasetId,
                records: applied.cleaned_records,
                reports,
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

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                ) : visibleChanges.length === 0 ? (
                    <div className="px-6 py-12 text-center text-sm text-slate-500">No changes match this filter.</div>
                ) : (
                    <div className="space-y-4 p-5 sm:p-6">
                        {groups.map(group => (
                            <ChangeGroupCard key={group.key} group={group} decisions={decisions}
                                onDecide={decide} onDecideAll={decideAll}
                            />
                        ))}
                    </div>
                )}

                {hasPreview && (
                    <div className="sticky bottom-4 z-20 px-5 pb-5 sm:px-6 sm:pb-6">
                        <ReviewActionBar
                            approved={stats.approved}
                            applyable={stats.applyable}
                            pending={stats.pending}
                            loading={applyLoading}
                            onApply={applyApprovedChanges}
                        />
                    </div>
                )}
            </section>
        </main>
    );
}
