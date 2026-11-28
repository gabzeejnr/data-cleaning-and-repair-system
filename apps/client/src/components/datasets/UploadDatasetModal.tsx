import { useRef, useState } from "react";
import {
    X, UploadCloud, File, FileSpreadsheet,
    FileText, CheckCircle2, AlertCircle, Info
} from "../../libs";
import { getUploadErrorMessage } from "../../utils";
import { MAX_FILE_SIZE, ACCEPTED_EXTENSIONS, whatHappensNext, supportedFormats } from "../../data/datasets.data";
import type { DragEvent, ChangeEvent } from "react";
import type { UploadDatasetModalProps, UploadSupportedFormat } from "../../types";


function SupportedFormats({ title, text, icon: Icon }: UploadSupportedFormat) {
    return (
        <div className="flex items-center gap-3">
            <Icon size={22} className="text-success" />
            <div>
                <p className="text-sm font-semibold text-text-primary">{title}</p>
                <p className="text-xs text-text-secondary">{text}</p>
            </div>
        </div>
    )
}

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
        console.log(selectedFile.name)
        if (!ACCEPTED_EXTENSIONS.includes(extension)) {
            setError("Choose a CSV, Excel or PDF file (.csv, .xls, .xlsx, .pdf).");
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
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
            onMouseDown={e => { if (e.target === e.currentTarget && !uploading) onClose() }}
        >
            <section role="dialog" aria-modal="true" aria-labelledby="upload-title" className="my-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-bg-secondary shadow-2xl">
                <header className="flex items-start justify-between border-b border-border px-6 py-5 sm:px-8">
                    <div className="flex items-start gap-3">
                        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                            <UploadCloud size={23} />
                        </div>
                        <div>
                            <h2 id="upload-title" className="text-xl font-bold text-text-primary">Upload dataset</h2>
                            <p className="mt-1 text-sm text-text-secondary">Upload a file to start profiling and cleaning your data.</p>
                        </div>
                    </div>

                    <button type="button" onClick={onClose} disabled={uploading} aria-label="Close upload dialog"
                        className="rounded-lg p-2 text-text-secondary transition hover:bg-brand-soft hover:text-text-primary disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </header>

                <div className="grid md:grid-cols-[1.6fr_1fr]">
                    <div className="p-6 sm:p-8">
                        <input ref={inputRef} type="file" accept={ACCEPTED_EXTENSIONS.join(",")} className="hidden" onChange={handleFileChange} />

                        <div onDragOver={(e) => { e.preventDefault(); setDragging(true) }} onDrop={handleDrop}
                            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) { setDragging(false) } }}
                            className={`flex min-h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition ${dragging
                                ? "border-brand bg-brand-soft"
                                : "border-border bg-bg-primary hover:border-brand/50"
                                }`
                            }
                        >
                            <div className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand"><UploadCloud size={28} /></div>

                            <p className="mt-4 font-semibold text-text-primary">Drag and drop your file here</p>
                            <p className="mt-1 text-sm text-text-secondary">or</p>

                            <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover">
                                Choose file
                            </button>

                            <p className="mt-4 text-xs text-text-secondary">CSV or Excel · Maximum 10 MB</p>
                        </div>

                        {file && (
                            <div className="mt-4 flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
                                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-success/10 text-success">
                                    {file.name.toLowerCase().endsWith(".csv")
                                        ? <FileText size={21} />
                                        : (file.name.toLowerCase().endsWith(".csv")
                                            ? <FileSpreadsheet size={21} />
                                            : <File size={21} />
                                        )
                                    }
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-text-primary">{file.name}</p>
                                    <p className="mt-1 text-xs text-text-secondary">{fileSize} · Ready to upload</p>
                                </div>

                                <CheckCircle2 size={19} className="shrink-0 text-success" />

                                <button type="button" disabled={uploading} onClick={() => setFile(null)} aria-label="Remove selected file"
                                    className="rounded-md p-1 text-text-secondary hover:bg-bg-secondary hover:text-danger"
                                >
                                    <X size={17} />
                                </button>
                            </div>
                        )}

                        <label htmlFor="dataset-name" className="mt-6 block text-sm font-medium text-text-primary">
                            Dataset name <span className="font-normal text-text-secondary">(optional)</span>
                        </label>
                        <input id="dataset-name" value={name} onChange={(e) => setName(e.target.value)} disabled={uploading} maxLength={150} placeholder="e.g. Sales data — Q3 2026"
                            className="mt-2 w-full rounded-xl border border-border bg-bg-primary px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-brand focus:ring-4 focus:ring-brand/10"
                        />
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
                            <Info size={14} /> If omitted, your original filename will be used.
                        </p>

                        {error && (
                            <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-danger/10 p-3 text-sm text-danger">
                                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                                {error}
                            </p>
                        )}

                        <footer className="mt-7 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                            <button type="button" onClick={onClose} disabled={uploading}
                                className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-text-secondary transition hover:bg-bg-primary disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button type="button" onClick={() => void handleSubmit()} disabled={!file || uploading}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <UploadCloud size={18} />
                                {uploading ? "Uploading..." : "Upload dataset"}
                            </button>
                        </footer>
                    </div>

                    <aside className="border-t border-border bg-bg-primary p-6 sm:p-8 md:border-l md:border-t-0">
                        <h3 className="font-semibold text-text-primary">Supported formats</h3>

                        <div className="mt-4 space-y-4">
                            {supportedFormats.map(f => (
                                <SupportedFormats key={f.text} {...f} />
                            ))}
                        </div>

                        <div className="my-6 border-t border-border" />

                        <h3 className="font-semibold text-text-primary">What happens next?</h3>
                        <ol className="mt-4 space-y-4">
                            {whatHappensNext.map((step, index) => (
                                <li key={step} className="flex items-start gap-3">
                                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold text-white">{index + 1}</span>
                                    <p className="pt-0.5 text-sm leading-5 text-text-secondary">{step}</p>
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