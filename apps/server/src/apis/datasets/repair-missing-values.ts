import { z } from "zod";

export const repairMissingValuesZod = z.object({
    datasetId: z.uuid(),
    column: z.string().min(1),
    strategy: z.enum(["mean", "median", "mode", "constant"]),
    fillValue: z.unknown().optional()
})

export type RepairMissingValueInput = z.infer<typeof repairMissingValuesZod>