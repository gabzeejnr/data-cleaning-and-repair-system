import { useState } from "react";
import { Check, ChevronDown, Database, Search } from "../../libs";
import type { Dataset } from "@data-cleaning-system/shared";

interface DatasetSelectorProps {
    datasets: Dataset[];
    value: string;
    onChange: (datasetId: string) => void;
    disabled?: boolean;
}

export default function DatasetSelector({ datasets, value, onChange, disabled = false }: DatasetSelectorProps) {

    const [open, setOpen] = useState<boolean>(false);
    const [search, setSearch] = useState<string>("");
    const selectedDataset = datasets.find(dataset => dataset.id === value)
    const filteredDatasets = datasets.filter(d => d.filename.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="relative w-full max-w-xl">
            <label className="mb-2 block text-sm font-medium text-text-secondary">Select dataset</label>

            <button type="button" disabled={disabled} onClick={() => setOpen(current => !current)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-bg-secondary p-3 text-left shadow-sm transition hover:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
                <span className="flex min-w-0 items-center gap-3">
                    <span className="rounded-lg bg-brand-soft p-2 text-brand">
                        <Database size={20} />
                    </span>

                    <span className="min-w-0">
                        <span className="block truncate font-medium text-text-primary">{selectedDataset?.filename ?? "Choose a dataset"}</span>
                        <span className="block text-sm text-text-secondary">
                            {selectedDataset
                                ? `${selectedDataset.rowCount.toLocaleString()} records · ${selectedDataset.columnCount} columns`
                                : `${datasets.length} available datasets`
                            }
                        </span>
                    </span>
                </span>
                <ChevronDown size={18} className={`shrink-0 text-text-secondary transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && !disabled && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-border bg-bg-secondary shadow-xl">
                    <div className="border-b border-border p-3">
                        <div className="flex items-center gap-2 rounded-lg border border-border px-3">
                            <Search size={17} className="shrink-0 text-text-secondary" />
                            <input autoFocus value={search} placeholder="Search datasets..."
                                onChange={(e) => setSearch(e.target.value)} className="w-full bg-transparent py-2.5 text-sm text-text-primary outline-none placeholder:text-text-secondary"
                            />
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto p-1.5">
                        {filteredDatasets.length === 0
                            ? <p className="px-3 py-6 text-center text-sm text-text-secondary">No matching datasets found.</p>
                            : filteredDatasets.map((dataset) => {
                                const selected = dataset.id === value;

                                return (
                                    <button key={dataset.id} type="button"
                                        onClick={() => {
                                            onChange(dataset.id);
                                            setOpen(false);
                                            setSearch("");
                                        }}
                                        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition ${selected
                                            ? "bg-brand-soft"
                                            : "hover:bg-bg-primary"
                                            }`
                                        }
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-medium text-text-primary">{dataset.filename}</span>
                                            <span className="text-xs text-text-secondary">
                                                {dataset.rowCount.toLocaleString()} records ·{" "}
                                                {dataset.columnCount} columns
                                            </span>
                                        </span>

                                        {selected && <Check size={17} className="shrink-0 text-brand" />}
                                    </button>
                                )
                            })
                        }
                    </div>
                </div>
            )}
        </div>
    )
}