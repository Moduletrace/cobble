import { z } from "zod";
import {
    HostDirectoryAccesses,
    HostDirectoryNameMaxChars,
    HostDirectorySourceMaxChars,
} from "@/src/dict/host-directory-dict";

export const HostDirectoryAccessSchema = z.enum(
    HostDirectoryAccesses.map((access) => access.value) as [string, ...string[]],
    "Pick read and write, or read only",
);

const HostDirectoryNameSchema = z
    .string()
    .trim()
    .min(1, "Give the folder a name")
    .max(HostDirectoryNameMaxChars, `Keep the name under ${HostDirectoryNameMaxChars} characters`);

/**
 * Checked again by `hostDirectoryPath`: absolute, no `..`, and not one of
 * the host's own system folders.
 */
const HostDirectorySourceSchema = z
    .string()
    .trim()
    .min(1, "Give its path on the host machine")
    .max(HostDirectorySourceMaxChars, `Keep the path under ${HostDirectorySourceMaxChars} characters`);

const HostDirectoryIdSchema = z.coerce.number().int().positive("Pick a host directory");

export const CreateHostDirectoryRequestSchema = z.object({
    name: HostDirectoryNameSchema,
    source: HostDirectorySourceSchema,
});

export type CreateHostDirectoryRequest = z.infer<typeof CreateHostDirectoryRequestSchema>;

export const UpdateHostDirectoryRequestSchema = z.object({
    host_directory_id: HostDirectoryIdSchema,
    name: HostDirectoryNameSchema.optional(),
    source: HostDirectorySourceSchema.optional(),
});

export type UpdateHostDirectoryRequest = z.infer<typeof UpdateHostDirectoryRequestSchema>;

export const HostDirectoryIdRequestSchema = z.object({
    host_directory_id: HostDirectoryIdSchema,
});

export type HostDirectoryIdRequest = z.infer<typeof HostDirectoryIdRequestSchema>;

export const LinkHostDirectoryRequestSchema = z.object({
    host_directory_id: HostDirectoryIdSchema,
    /**
     * Exactly one of the two: the computer it is mounted into, or the
     * workspace (on every computer of it).
     */
    computer_id: z.coerce.number().int().positive().nullish(),
    workspace_id: z.coerce.number().int().positive().nullish(),
    access: HostDirectoryAccessSchema.default("read-write"),
});

export type LinkHostDirectoryRequest = z.infer<typeof LinkHostDirectoryRequestSchema>;

export const UnlinkHostDirectoryRequestSchema = LinkHostDirectoryRequestSchema.pick({
    host_directory_id: true,
    computer_id: true,
    workspace_id: true,
});

export type UnlinkHostDirectoryRequest = z.infer<typeof UnlinkHostDirectoryRequestSchema>;

export const SetHostDirectoryAccessRequestSchema = UnlinkHostDirectoryRequestSchema.extend({
    access: HostDirectoryAccessSchema,
});

export type SetHostDirectoryAccessRequest = z.infer<typeof SetHostDirectoryAccessRequestSchema>;

export const CheckHostDirectoryRequestSchema = z.object({
    host_directory_id: HostDirectoryIdSchema,
    computer_id: z.coerce.number().int().positive("Pick the computer to check it on"),
});

export type CheckHostDirectoryRequest = z.infer<typeof CheckHostDirectoryRequestSchema>;