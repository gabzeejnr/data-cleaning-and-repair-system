import { z } from "zod";

const detectDuplicateSchema = z.object({
    datasetId: z.uuid(),
    columns: z.array(z.string().min(1)).min(1)
})

export { detectDuplicateSchema }