import type { Dataset } from "@data-cleaning-system/shared";

type DatasetsResponse = {
    message: string;
    data: Dataset[];
}

export type { DatasetsResponse }