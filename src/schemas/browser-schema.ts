import { z } from "zod";
import { BrowserComputerDefault, BrowserInheritDefault } from "@/src/dict/browser-dict";

const Id = z.coerce.number().int().positive();

const BrowserFields = z.object({
    browser_id: Id.optional(),
    description: z.string().trim().max(1000).default(""),
    url: z.string().trim().min(1, "Enter the browser server's URL").max(2000),
    headers: z.record(z.string().trim().min(1).max(200), z.string().max(4000)).default({}),
    /**
     * Blank headers keep the saved ones unless this says to drop them.
     */
    clear_headers: z.boolean().default(false),
    /**
     * Left out on a new browser: `BrowserDefaultExcludedTools`.
     */
    excluded_tools: z.array(z.string().max(200)).max(500).optional(),
    enabled: z.boolean().default(true),
    allow_routines: z.boolean().default(false),
});

export const SaveBrowserRequestSchema = BrowserFields.extend({
    name: z.string().trim().min(1, "Enter a name").max(80),
});

export const TestBrowserRequestSchema = BrowserFields.extend({
    name: z.string().trim().max(80).default(""),
});

export const BrowserIdSchema = z.object({ browser_id: Id });

export const BrowserAccessScopeSchema = z.object({
    bot_id: Id.optional(),
    workspace_id: Id.optional(),
});

export const SaveBrowserAccessRequestSchema = BrowserAccessScopeSchema.extend({
    default_browser: z.union([Id, z.literal(BrowserComputerDefault), z.literal(BrowserInheritDefault)]),
    available_ids: z.array(Id).max(100).default([]),
});

export type SaveBrowserRequest = z.infer<typeof SaveBrowserRequestSchema>;
export type TestBrowserRequest = z.infer<typeof TestBrowserRequestSchema>;
export type SaveBrowserAccessRequest = z.infer<typeof SaveBrowserAccessRequestSchema>;
