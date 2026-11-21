import BunSQLite from "@moduletrace/bun-sqlite";
import type { ExtensionBundleKind } from "@/src/types";
import exportKnowledgebases from "./export-knowledgebases";
import exportMcps from "./export-mcps";
import exportSkills from "./export-skills";
import exportTools from "./export-tools";
import type { ExistingExtensionItem } from "./match-extension-item";

type Params = {
    kind: ExtensionBundleKind;
};

type DocumentRow = {
    knowledgebase_id: number;
    name: string;
    size: number;
};

type AccessRow = {
    id: number;
    all_bots: number;
};

const Tables: Record<ExtensionBundleKind, string> = {
    mcp: "mcp_servers",
    tool: "custom_tools",
    skill: "skills",
    knowledgebase: "knowledgebases",
};

/**
 * The rows already here, in the shape a bundle carries them, so the import
 * compares like with like: the same builder the export uses, so a value
 * left out of a file is left out of this side too.
 */
export default async function grabExistingExtensionItems({ kind }: Params): Promise<ExistingExtensionItem[]> {
    const entries = await (kind == "mcp"
        ? exportMcps({ ids: [] })
        : kind == "tool"
          ? exportTools({ ids: [] })
          : kind == "skill"
            ? exportSkills({ ids: [] })
            : exportKnowledgebases({ ids: [] }));

    const access = await BunSQLite.sql<AccessRow>({
        sql: `SELECT id, all_bots FROM ${Tables[kind]}`,
    });

    const every_bot = new Set(
        (access.payload || []).filter((row) => Number(row.all_bots)).map((row) => Number(row.id)),
    );

    const items: ExistingExtensionItem[] = entries.map((entry) => ({
        id: entry.id,
        key: entry.item.key,
        config: entry.item.config as Record<string, unknown>,
        all_bots: every_bot.has(entry.id),
    }));

    if (kind != "knowledgebase") return items;

    const rows = await BunSQLite.sql<DocumentRow>({
        sql: `SELECT knowledgebase_id, name, size FROM knowledgebase_documents`,
    });

    return items.map((item) => ({
        ...item,
        documents: (rows.payload || [])
            .filter((row) => Number(row.knowledgebase_id) == item.id)
            .map((row) => ({ name: row.name || "", size: Number(row.size) || 0 })),
    }));
}