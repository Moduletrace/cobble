import { z } from "zod";
import { EnvParadigms, type EnvParadigm } from "@/src/dict/env-dict";

export const SaveEnvRequestSchema = z.object({
    env_id: z.coerce.number().int().positive().optional(),
    key: z.string().trim().min(1, "Enter a key").max(128),
    /**
     * Left out when editing keeps the saved value.
     */
    value: z.string().max(20000, "Keep values under 20,000 characters").optional(),
    description: z.string().trim().max(500).optional(),
    paradigm: z.enum(EnvParadigms.map((p) => p.value) as [EnvParadigm, ...EnvParadigm[]]),
    workspace_id: z.coerce.number().int().positive().nullable().optional(),
    computer_id: z.coerce.number().int().positive().nullable().optional(),
    secret: z.boolean(),
    expose_to_computers: z.boolean(),
});

export const EnvIdRequestSchema = z.object({
    env_id: z.coerce.number().int().positive(),
});

export type SaveEnvRequest = z.infer<typeof SaveEnvRequestSchema>;
export type EnvIdRequest = z.infer<typeof EnvIdRequestSchema>;
