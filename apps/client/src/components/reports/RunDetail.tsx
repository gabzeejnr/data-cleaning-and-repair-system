import { useState } from "react";
import { X } from "../../libs";
import { API } from "../../apis/axios";
import ErrorBreakdown from "./ErrorBreakdown";
import type { CleaningRun } from "../../types/reports.types";

type DownloadFormat = "csv" | "xlsx" | "both";
interface RunDetailProps {
    run: CleaningRun;
    onClose: () => void;
}

function Compare({ label, before, after }: { label: string; before: number; after: number }) {
    return (
        <div className="rounded-xl bg-mist p-4">
            <p className="text-xs font-medium text-muted">{label}</p>
            <p className="mt-2 flex items-baseline gap-2 tabular-nums">
                <span className="text-muted line-through">{before.toLocaleString()}</span>
                <span aria-hidden="true" className="text-muted">→</span>
                <span className="text-lg font-bold text-ink">{after.toLocaleString()}</span>
            </p>
        </div>
    )
}

export default function RunDetail({ run, onClose }: RunDetailProps) {
    const [format, setFormat] = useState<DownloadFormat>("csv")
    const [downloading, setDownloading] = useState<boolean>(false)
    const [downloadError, setDownloadError] = useState<string>("")


    async function downloadFile(fileFormat: "csv" | "xlsx") {
        const { data } = await API.get(`/datasets/${run.id}/download`, {
            params: { format: fileFormat },
            responseType: "blob"
        })

        console.log(data)
        const blob = new Blob([data], {
            type: (fileFormat === "csv"
                ? "text/csv;charset=utf-8;"
                : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");;

        link.href = url;
        link.download = `${run.datasetName.replace(/\.[^.]+$/, "")}-repaired.${fileFormat}`
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }

    async function handleDownlad() {
        setDownloading(true);
        setDownloadError("");

        try {
            if (format === "both") {
                await downloadFile("csv");
                await downloadFile("xlsx");
            } else await downloadFile(format);
        } catch {
            setDownloadError("Download failed. Please try again.");
        } finally {
            setDownloading(false)
        }
    }

    return (
        <aside aria-label="Run details" className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs text-muted">{new Date(run.createdAt).toLocaleString()}</p>
                    <h2 className="mt-1 truncate font-semibold text-ink">{run.datasetName}</h2>
                </div>
                <button type="button" onClick={onClose} aria-label="Close details" className="rounded-lg p-2 text-muted hover:bg-mist hover:text-ink">
                    <X size={18} />
                </button>
            </header>

            <div className="mt-6 grid grid-cols-2 gap-3">
                <Compare label="Rows" before={run.rowsBefore} after={run.rowsAfter} />
                <Compare label="Missing values" before={run.missingBefore} after={run.missingAfter} />
            </div>

            <h3 className="mt-8 text-sm font-semibold text-ink">What changed</h3>
            <div className="mt-4">
                <ErrorBreakdown items={run.breakdown} />
            </div>

            <div className="mt-8 border-t border-line pt-5">
                <h3 className="text-sm font-semibold text-ink">Download Repaired Dataset</h3>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <select value={format} onChange={(e) => setFormat(e.target.value as DownloadFormat)} disabled={downloading} aria-label="Download format"
                        className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-indigo-500"
                    >
                        <option value="csv">As CSV</option>
                        <option value="xlsx">As Excel Spreadsheet</option>
                        <option value="both">As Both</option>
                    </select>

                    <button type="button" onClick={handleDownlad} disabled={downloading}
                        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >{downloading ? "Downloading" : "Download"}</button>
                </div>

                {downloadError && <p role="alert" className="mt-3 text-sm text-red-600">{downloadError}</p>}
            </div>
        </aside>
    )
}