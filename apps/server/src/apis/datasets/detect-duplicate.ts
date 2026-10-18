import { z } from "zod";

export const duplicateZod = z.object({
    datasetId: z.uuid(),
    columns: z.array(z.string().min(1)).min(1)
})

export type DuplicateInput = z.infer<typeof duplicateZod>