import BunSQLite from "@moduletrace/bun-sqlite";
import { z } from "zod";
import type {
    BUN_SQLITE_COBBLE_CUSTOM_TOOLS,
    BUN_SQLITE_COBBLE_MCP_SERVERS,
    BUN_SQLITE_COBBLE_SKILLS,
} from "@/db/types/db";
import grabCustomTool from "@/src/functions/backend/db/extensions/grab-custom-tool";
import grabExtensionAccess from "@/src/functions/backend/db/extensions/grab-extension-access";
import grabMcpServer from "@/src/functions/backend/db/extensions/grab-mcp-server";
import grabAllEnvs from "@/src/functions/backend/db/envs/grab-all-envs";
import grabSkill from "@/src/functions/backend/db/extensions/grab-skill";
import parseCustomToolRow from "@/src/functions/backend/db/extensions/parse-custom-tool-row";
import parseMcpServerRow from "@/src/functions/backend/db/extensions/parse-mcp-server-row";
import parseSkillRow from "@/src/functions/backend/db/extensions/parse-skill-row";
import type { ExtensionKind } from "@/src/functions/backend/db/extensions/extension-tables";
import redactSecrets from "@/src/utils/redact-secrets";
import type { HarnessTool } from "../../../types";
import assertSuperAdminRun from "./assert-super-admin-run";
import describeExtension from "./describe-extension";
import { ExtensionKindSchema } from "./extension-kind-schema";

type Params = {
    user_id: number | string;
};

type Args = {
    kind?: z.infer<typeof ExtensionKindSchema>;
    id?: number;
    query?: string;
};

/**
 * Lets the coordinator read the install's skills, MCP servers and custom
 * tools: every one as a line, or one in full (the runbook, how a server is
 * reached, a tool's arguments and config) before it changes it. Literal
 * header and env values and every secret env's value stay hidden.
 */
export default function listExtensionsTool({ user_id }: Params): HarnessTool<Args> {
    return {
        name: "list_extensions",
        description: `List the install's skills (runbooks), MCP servers and custom tools, with their ids, whether they're on, how they're doing and which bots and workspaces get them. Give kind and id to read one in full (a skill's runbook, how an MCP server is reached, a tool's arguments and config) before you change it. query filters by name, slug or description.`,
        schema: z
            .object({
                kind: ExtensionKindSchema.optional(),
                id: z.number().int().positive().optional(),
                query: z.string().trim().max(200).optional(),
            })
            .refine((args) => !args.id || args.kind, "Give the kind with the id."),
        run: async ({ args }) => {
            await assertSuperAdminRun({ user_id });

            const text = args.id && args.kind ? await describeOne({ kind: args.kind, id: args.id }) : await describeAll(args);
            const secrets = (await grabAllEnvs()).filter((env) => env.secret);

            return redactSecrets({ text, secrets });
        },
    };
}

async function describeOne({ kind, id }: { kind: Exclude<ExtensionKind, "knowledgebase">; id: number }) {
    const access = (await grabExtensionAccess({ kind }))(id);

    if (kind == "skill") return describeExtension({ kind, item: await grabSkill({ skill_id: id }), ...access, full: true });
    if (kind == "mcp") return describeExtension({ kind, item: await grabMcpServer({ mcp_server_id: id }), ...access, full: true });

    return describeExtension({ kind, item: await grabCustomTool({ custom_tool_id: id }), ...access, full: true });
}

async function describeAll({ kind, query }: Args) {
    const [skills, servers, tools, skill_access, mcp_access, tool_access] = await Promise.all([
        BunSQLite.sql<BUN_SQLITE_COBBLE_SKILLS>({ sql: `SELECT * FROM skills ORDER BY name COLLATE NOCASE, id` }),
        BunSQLite.sql<BUN_SQLITE_COBBLE_MCP_SERVERS>({ sql: `SELECT * FROM mcp_servers ORDER BY name COLLATE NOCASE, id` }),
        BunSQLite.sql<BUN_SQLITE_COBBLE_CUSTOM_TOOLS>({ sql: `SELECT * FROM custom_tools ORDER BY name COLLATE NOCASE, id` }),
        grabExtensionAccess({ kind: "skill" }),
        grabExtensionAccess({ kind: "mcp" }),
        grabExtensionAccess({ kind: "tool" }),
    ]);

    const needle = (query || "").toLowerCase();
    const matches = (fields: string[]) => !needle || fields.some((field) => field.toLowerCase().includes(needle));

    const lines = [
        ...(!kind || kind == "skill"
            ? (skills.payload || [])
                  .map((row) => parseSkillRow({ row }))
                  .filter((item) => matches([item.name, item.slug, item.description]))
                  .map((item) => describeExtension({ kind: "skill", item, ...skill_access(item.id) }))
            : []),
        ...(!kind || kind == "mcp"
            ? (servers.payload || [])
                  .map((row) => parseMcpServerRow({ row }))
                  .filter((item) => matches([item.name, item.slug, item.description]))
                  .map((item) => describeExtension({ kind: "mcp", item, ...mcp_access(item.id) }))
            : []),
        ...(!kind || kind == "tool"
            ? (tools.payload || [])
                  .map((row) => parseCustomToolRow({ row }))
                  .filter((item) => matches([item.name, item.description]))
                  .map((item) => describeExtension({ kind: "tool", item, ...tool_access(item.id) }))
            : []),
    ];

    return lines.join("\n") || (query ? `Nothing matches "${query}".` : `There are none yet.`);
}
