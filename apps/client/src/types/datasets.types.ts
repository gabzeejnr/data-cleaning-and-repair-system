import type { Dataset } from "@data-cleaning-system/shared";

type DatasetsResponse = {
    message: string;
    data: Dataset[];
}

interface UploadDatasetModalProps {
    onClose: () => void;
    onUpload: (file: File, name: string) => Promise<void>;
}

export type { DatasetsResponse, UploadDatasetModalProps }