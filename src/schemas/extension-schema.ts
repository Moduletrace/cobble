import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import {
    CustomToolHttpMethods,
    CustomToolScriptLanguages,
    type CustomToolScriptLanguage,
} from "@/src/dict/custom-tool-dict";
import { McpTransports, type McpTransport } from "@/src/dict/mcp-dict";
import checkCustomToolName from "@/src/utils/check-custom-tool-name";
import checkSkillSlug from "@/src/utils/check-skill-slug";

const Id = z.coerce.number().int().positive();
const Ids = z.array(Id).max(1000).default([]);

/**
 * Header or env names to their (template) values.
 */
const TemplateMap = z
    .record(z.string().trim().min(1).max(200), z.string().max(4000))
    .default({});

const TimeoutMs = z.coerce.number().int().min(1000).max(AppData.CustomToolMaxTimeoutMs).optional();

const McpServerFields = z.object({
    mcp_server_id: Id.optional(),
    name: z.string().trim().min(1, "Enter a name").max(80),
    description: z.string().trim().max(1000).default(""),
    transport: z.enum(McpTransports.map((t) => t.value) as [McpTransport, ...McpTransport[]]),
    url: z.string().trim().max(2000).default(""),
    headers: TemplateMap,
    command: z.string().trim().max(4000).default(""),
    setup_command: z.string().trim().max(8000).default(""),
    env: TemplateMap,
    excluded_tools: z.array(z.string().max(200)).max(500).default([]),
    enabled: z.boolean().default(true),
    all_bots: z.boolean().default(false),
});

function checkMcpServerReach(
    value: { transport: McpTransport; url: string; command: string },
    ctx: z.RefinementCtx,
) {
    if (value.transport == "remote" && !/^(https?:\/\/|\{\{\s*env\.)/.test(value.url)) {
        ctx.addIssue({ code: "custom", path: ["url"], message: "Enter the server's http(s) URL." });
    }

    if (value.transport == "stdio" && !value.command) {
        ctx.addIssue({ code: "custom", path: ["command"], message: "Enter the command that starts the server." });
    }
}

export const SaveMcpServerRequestSchema = McpServerFields.superRefine(checkMcpServerReach);

/**
 * A server as the form has it, saved or not: a name isn't needed yet.
 */
export const TestMcpServerRequestSchema = McpServerFields.extend({
    name: z.string().trim().max(80).default(""),
}).superRefine(checkMcpServerReach);

export const McpServerIdRequestSchema = z.object({
    mcp_server_id: Id,
});

export const SyncMcpServerRequestSchema = McpServerIdRequestSchema.extend({
    /**
     * Runs a stdio server's setup again first.
     */
    reinstall: z.boolean().default(false),
});

export const SetExtensionAccessRequestSchema = z.object({
    id: Id,
    bot_ids: Ids,
    workspace_ids: Ids,
    all_bots: z.boolean().optional(),
});

export const SetBotExtensionRequestSchema = z.object({
    bot_id: Id,
    kind: z.enum(["mcp", "tool", "skill", "knowledgebase"]),
    id: Id,
    /**
     * The workspace the bot is seen in, for the list that comes back.
     */
    workspace_id: Id.nullable().optional(),
});

export const SetWorkspaceExtensionRequestSchema = z.object({
    workspace_id: Id,
    kind: z.enum(["mcp", "tool", "skill", "knowledgebase"]),
    id: Id,
});

/**
 * A tool's arguments: a JSON schema of an object.
 */
const ToolParameters = z
    .record(z.string(), z.unknown())
    .refine((value) => value.type == "object", { message: `The arguments schema must have "type": "object".` })
    .refine((value) => JSON.stringify(value).length <= 20000, { message: "Keep the arguments schema under 20,000 characters." });

const ToolConfig = z.discriminatedUnion("kind", [
    z.object({
        kind: z.literal("http"),
        config: z.object({
            method: z.enum(CustomToolHttpMethods),
            url: z.string().trim().min(1, "Enter the URL").max(4000),
            headers: TemplateMap,
            body: z.string().max(20000).default(""),
            timeout_ms: TimeoutMs,
        }),
    }),
    z.object({
        kind: z.literal("script"),
        config: z.object({
            language: z.enum(
                CustomToolScriptLanguages.map((l) => l.value) as [CustomToolScriptLanguage, ...CustomToolScriptLanguage[]],
            ),
            code: z.string().min(1, "Enter the code").max(60000, "Keep the code under 60,000 characters"),
            timeout_ms: TimeoutMs,
        }),
    }),
    z.object({
        kind: z.literal("prompt"),
        config: z.object({
            prompt: z.string().trim().min(1, "Enter the prompt").max(20000),
        }),
    }),
]);

export const SaveCustomToolRequestSchema = z
    .object({
        custom_tool_id: Id.optional(),
        name: z
            .string()
            .trim()
            .superRefine((name, ctx) => {
                const problem = checkCustomToolName({ name });
                if (problem) ctx.addIssue({ code: "custom", message: problem });
            }),
        description: z.string().trim().min(1, "Describe what it does, for the bots").max(2000),
        parameters: ToolParameters,
        enabled: z.boolean().default(true),
        all_bots: z.boolean().default(false),
    })
    .and(ToolConfig);

export const CustomToolIdRequestSchema = z.object({
    custom_tool_id: Id,
});

/**
 * A tool as its form has it, saved or not: only what runs it.
 */
const DraftCustomTool = z.object({ parameters: ToolParameters }).and(ToolConfig);

/**
 * Tries a saved tool (`custom_tool_id`, the run counts as its last) or the
 * one in the form (`draft`, nothing saved).
 */
export const TestCustomToolRequestSchema = z
    .object({
        custom_tool_id: Id.optional(),
        draft: DraftCustomTool.optional(),
        args: z.record(z.string(), z.unknown()).default({}),
        /**
         * Where a script tool runs. The main computer when not given.
         */
        computer_id: Id.optional(),
    })
    .refine((value) => value.custom_tool_id || value.draft, { message: "Pick a tool to try." });

/**
 * A skill: the runbook, and the line that tells a bot when to load it.
 */
export const SaveSkillRequestSchema = z.object({
    skill_id: Id.optional(),
    name: z.string().trim().min(1, "Enter a name").max(80),
    slug: z
        .string()
        .trim()
        .superRefine((slug, ctx) => {
            const problem = checkSkillSlug({ slug });
            if (problem) ctx.addIssue({ code: "custom", message: problem });
        }),
    description: z
        .string()
        .trim()
        .min(1, "Say in one line when a bot should use it")
        .max(AppData.SkillDescriptionMaxChars),
    body: z
        .string()
        .trim()
        .min(1, "Write the runbook")
        /**
         * Only the ceiling: the install's own limit is a setting, checked by
         * `assertSkillBodyFits` when a runbook is saved or proposed.
         */
        .max(AppData.SkillBodyLimitMax, `Keep the runbook under ${AppData.SkillBodyLimitMax} characters`),
    enabled: z.boolean().default(true),
    all_bots: z.boolean().default(false),
});

/**
 * The install's skill limits (Settings > General). Zero puts the code's
 * default back for that one.
 */
export const SaveSkillLimitsRequestSchema = z.object({
    body_max_chars: z.coerce.number().int().min(0).max(AppData.SkillBodyLimitMax),
    body_shown_chars: z.coerce.number().int().min(0).max(AppData.SkillBodyLimitMax),
});

export const SkillIdRequestSchema = z.object({
    skill_id: Id,
});

export type SaveMcpServerRequest = z.infer<typeof SaveMcpServerRequestSchema>;
export type SaveSkillRequest = z.infer<typeof SaveSkillRequestSchema>;
export type SaveCustomToolRequest = z.infer<typeof SaveCustomToolRequestSchema>;
export type TestMcpServerRequest = z.infer<typeof TestMcpServerRequestSchema>;
export type DraftCustomTool = z.infer<typeof DraftCustomTool>;

/**
 * A proposal the coordinator made, read, confirmed or rejected from its
 * card.
 */
export const ExtensionProposalIdRequestSchema = z.object({
    proposal_id: Id,
});
