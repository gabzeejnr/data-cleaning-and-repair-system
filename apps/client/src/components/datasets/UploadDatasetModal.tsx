import { useRef, useState } from "react";
import {
    X, UploadCloud, FileSpreadsheet, FileText,
    CheckCircle2, AlertCircle, Info
} from "../../libs";
import { getUploadErrorMessage } from "../../utils";
import { MAX_FILE_SIZE, ACCEPTED_EXTENSIONS, whatHappensNext } from "../../data/datasets.data";
import type { DragEvent, ChangeEvent } from "react";
import type { UploadDatasetModalProps } from "../../types";

export default function UploadDatasetModal({ onClose, onUpload }: UploadDatasetModalProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    function selectFile(selectedFile?: File) {
        if (!selectedFile) return;
        setError("");

        const extension = `.${selectedFile.name.split(".").pop()?.toLowerCase()}`;
        if (!ACCEPTED_EXTENSIONS.includes(extension)) {
            setError("Choose a CSV or Excel file (.csv, .xls, .xlsx).");
            return;
        }

        if (selectedFile.size > MAX_FILE_SIZE) {
            setError("The maximum file size is 10 MB.");
            return;
        }

        setFile(selectedFile);
    }

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        selectFile(event.target.files?.[0]);
        event.target.value = "";
    }

    function handleDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        setDragging(false);
        selectFile(event.dataTransfer.files[0]);
    }

    async function handleSubmit() {
        if (!file || uploading) return;

        setUploading(true);
        setError("");

        try {
            await onUpload(file, name.trim());
        } catch (err) {
            setError(getUploadErrorMessage(err, "Upload failed. Please try again."));
        } finally {
            setUploading(false);
        }
    }

    const fileSize = (file && file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : (file
            ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
            : ""
        )
    )

    return (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#11133B]/60 p-4 backdrop-blur-sm"
            onMouseDown={(event) => { if (event.target === event.currentTarget && !uploading) onClose() }}
        >
            <section role="dialog" aria-modal="true" aria-labelledby="upload-title" className="my-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
                    <div className="flex items-start gap-3">
                        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-brand">
                            <UploadCloud size={23} />
                        </div>
                        <div>
                            <h2 id="upload-title" className="text-xl font-bold text-[#11133B]">Upload dataset</h2>
                            <p className="mt-1 text-sm text-slate-500">Upload a file to start profiling and cleaning your data.</p>
                        </div>
                    </div>

                    <button type="button" onClick={onClose} disabled={uploading} aria-label="Close upload dialog"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-brand-soft hover:text-slate-700 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </header>

                <div className="grid md:grid-cols-[1.6fr_1fr]">
                    <div className="p-6 sm:p-8">
                        <input ref={inputRef} type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={handleFileChange} />

                        <div onDragOver={(e) => { e.preventDefault(); setDragging(true) }} onDrop={handleDrop}
                            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) { setDragging(false) } }}
                            className={`flex min-h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition ${dragging
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-indigo-200 bg-slate-50/70 hover:border-indigo-400"
                                }`
                            }
                        >
                            <div className="grid size-14 place-items-center rounded-2xl bg-indigo-100 text-brand"><UploadCloud size={28} /></div>

                            <p className="mt-4 font-semibold text-[#11133B]">Drag and drop your file here</p>
                            <p className="mt-1 text-sm text-slate-500">or</p>

                            <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand">
                                Choose file
                            </button>

                            <p className="mt-4 text-xs text-slate-500">CSV or Excel · Maximum 10 MB</p>
                        </div>

                        {file && (
                            <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                                    {file.name.toLowerCase().endsWith(".csv")
                                        ? <FileText size={21} />
                                        : <FileSpreadsheet size={21} />
                                    }
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-[#11133B]">{file.name}</p>
                                    <p className="mt-1 text-xs text-slate-500">{fileSize} · Ready to upload</p>
                                </div>

                                <CheckCircle2 size={19} className="shrink-0 text-emerald-600" />

                                <button type="button" disabled={uploading} onClick={() => setFile(null)} aria-label="Remove selected file"
                                    className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-rose-600"
                                >
                                    <X size={17} />
                                </button>
                            </div>
                        )}

                        <label htmlFor="dataset-name" className="mt-6 block text-sm font-medium text-[#11133B]">
                            Dataset name <span className="font-normal text-slate-400">(optional)</span>
                        </label>
                        <input id="dataset-name" value={name} onChange={(e) => setName(e.target.value)} disabled={uploading} maxLength={150} placeholder="e.g. Sales data — Q3 2026"
                            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                        />
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                            <Info size={14} /> If omitted, your original filename will be used.
                        </p>

                        {error && (
                            <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                                {error}
                            </p>
                        )}

                        <footer className="mt-7 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                            <button type="button" onClick={onClose} disabled={uploading}
                                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button type="button" onClick={() => void handleSubmit()} disabled={!file || uploading}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <UploadCloud size={18} />
                                {uploading ? "Uploading..." : "Upload dataset"}
                            </button>
                        </footer>
                    </div>

                    <aside className="border-t border-slate-100 bg-indigo-50/40 p-6 sm:p-8 md:border-l md:border-t-0">
                        <h3 className="font-semibold text-[#11133B]">Supported formats</h3>

                        <div className="mt-4 space-y-4">
                            <div className="flex items-center gap-3">
                                <FileText size={22} className="text-emerald-600" />
                                <div>
                                    <p className="text-sm font-semibold text-[#11133B]">CSV</p>
                                    <p className="text-xs text-slate-500">Comma-separated values</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet size={22} className="text-emerald-600" />
                                <div>
                                    <p className="text-sm font-semibold text-[#11133B]">Excel</p>
                                    <p className="text-xs text-slate-500">.xls and .xlsx workbooks</p>
                                </div>
                            </div>
                        </div>

                        <div className="my-6 border-t border-indigo-100" />

                        <h3 className="font-semibold text-[#11133B]">What happens next?</h3>
                        <ol className="mt-4 space-y-4">
                            {whatHappensNext.map((step, index) => (
                                <li key={step} className="flex items-start gap-3">
                                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold text-white">{index + 1}</span>
                                    <p className="pt-0.5 text-sm leading-5 text-slate-600">{step}</p>
                                </li>
                            ))}
                        </ol>

                        <p className="mt-8 text-sm font-semibold text-brand">Clean data. Better decisions.</p>
                    </aside>
                </div>
            </section>
        </div>
    )
}