import { z } from "zod";
import { AppData } from "@/src/data/app-data";

const ComputerCpusSchema = z.coerce
    .number()
    .min(AppData.ComputerMinCpus, `Give it at least ${AppData.ComputerMinCpus} CPU`)
    .max(AppData.ComputerMaxCpus, `Keep it under ${AppData.ComputerMaxCpus} CPUs`);

const ComputerMemoryMbSchema = z.coerce
    .number()
    .int()
    .min(AppData.ComputerMinMemoryMb, `Give it at least ${AppData.ComputerMinMemoryMb} MB of memory`);

const ComputerNameSchema = z.string().trim().min(1, "Give the computer a name").max(60, "Keep the name under 60 characters");
const ComputerDescriptionSchema = z.string().trim().max(240, "Keep the description short");

export const CreateComputerRequestSchema = z.object({
    name: ComputerNameSchema,
    description: ComputerDescriptionSchema.default(""),
    /**
     * Defaults to `AppData.ComputerDefaultCpus` / `ComputerDefaultMemoryMb`.
     */
    cpus: ComputerCpusSchema.optional(),
    memory_mb: ComputerMemoryMbSchema.optional(),
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

export const UpdateComputerRequestSchema = ComputerIdRequestSchema.extend({
    name: ComputerNameSchema.optional(),
    description: ComputerDescriptionSchema.optional(),
    cpus: ComputerCpusSchema.optional(),
    memory_mb: ComputerMemoryMbSchema.optional(),
});

export type UpdateComputerRequest = z.infer<typeof UpdateComputerRequestSchema>;
