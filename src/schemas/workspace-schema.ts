import { z } from "zod";
import { AppData } from "@/src/data/app-data";

const WorkspaceId = z.coerce.number().int().positive("Pick a workspace");
const Prompt = z.string().trim().max(AppData.PromptMaxLength, `Keep it under ${AppData.PromptMaxLength} characters`);

export const CreateWorkspaceRequestSchema = z.object({
    name: z.string().trim().min(1, "Give the workspace a name").max(60, "Keep the name under 60 characters"),
    description: z.string().trim().max(240, "Keep the description short").default(""),
    system_prompt: Prompt.default(""),
});

export type CreateWorkspaceRequest = z.infer<typeof CreateWorkspaceRequestSchema>;

export const UpdateWorkspaceRequestSchema = CreateWorkspaceRequestSchema.extend({
    workspace_id: WorkspaceId,
    archived: z.boolean().optional(),
});

export type UpdateWorkspaceRequest = z.infer<typeof UpdateWorkspaceRequestSchema>;

export const WorkspaceIdRequestSchema = z.object({
    workspace_id: WorkspaceId,
});

export type WorkspaceIdRequest = z.infer<typeof WorkspaceIdRequestSchema>;

export const WorkspaceBotRequestSchema = z.object({
    workspace_id: WorkspaceId,
    bot_id: z.coerce.number().int().positive("Pick a bot"),
});

export type WorkspaceBotRequest = z.infer<typeof WorkspaceBotRequestSchema>;

export const UpdateWorkspaceBotRequestSchema = WorkspaceBotRequestSchema.extend({
    system_prompt: Prompt.default(""),
    memory: Prompt.default(""),
});

export type UpdateWorkspaceBotRequest = z.infer<typeof UpdateWorkspaceBotRequestSchema>;

export const WorkspaceComputerRequestSchema = z.object({
    workspace_id: WorkspaceId,
    computer_id: z.coerce.number().int().positive("Pick a computer"),
});

export type WorkspaceComputerRequest = z.infer<typeof WorkspaceComputerRequestSchema>;
