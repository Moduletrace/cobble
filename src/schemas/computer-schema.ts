import { z } from "zod";

export const CreateComputerRequestSchema = z.object({
    name: z.string().trim().min(1, "Give the computer a name").max(60, "Keep the name under 60 characters"),
    description: z.string().trim().max(240, "Keep the description short").default(""),
    /**
     * Also link it to this workspace.
     */
    workspace_id: z.coerce.number().int().positive().nullish(),
});

export type CreateComputerRequest = z.infer<typeof CreateComputerRequestSchema>;

export const ComputerIdRequestSchema = z.object({
    computer_id: z.coerce.number().int().positive("Pick a computer"),
});

export type ComputerIdRequest = z.infer<typeof ComputerIdRequestSchema>;
