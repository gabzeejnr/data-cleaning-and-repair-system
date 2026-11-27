import type { Dataset } from "@data-cleaning-system/shared";
import type { LucideIcon } from "lucide-react";

type SupportedFormats = "CSV" | "Excel" | "PDF";

interface DatasetsResponse {
    message: string;
    data: Dataset[];
}

interface UploadDatasetModalProps {
    onClose: () => void;
    onUpload: (file: File, name: string) => Promise<void>;
}

interface UploadSupportedFormat {
    title: SupportedFormats;
    text: string;
    icon: LucideIcon;
}

export type { DatasetsResponse, UploadDatasetModalProps, UploadSupportedFormat }