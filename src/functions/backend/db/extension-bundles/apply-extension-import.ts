import type { SaveCustomToolRequest, SaveMcpServerRequest, SaveSkillRequest } from "@/src/schemas/extension-schema";
import type { SaveKnowledgebaseRequest } from "@/src/schemas/knowledgebase-schema";
import type {
    ExtensionBundle,
    ExtensionBundleItem,
    ExtensionBundleKind,
    ExtensionImportAction,
    ExtensionImportApplyPayload,
    ExtensionImportDecision,
    ExtensionImportOutcome,
} from "@/src/types";
import mcpServerSlug from "@/src/utils/mcp-server-slug";
import safeErrorMessage from "@/src/utils/safe-error-message";
import grabMcpsOverview from "../extensions/grab-mcps-overview";
import grabSkillsOverview from "../extensions/grab-skills-overview";
import grabToolsOverview from "../extensions/grab-tools-overview";
import saveCustomTool from "../extensions/save-custom-tool";
import saveMcpServer from "../extensions/save-mcp-server";
import saveSkill from "../extensions/save-skill";
import grabKnowledgebasesOverview from "../knowledgebases/grab-knowledgebases-overview";
import recordKnowledgebaseDocument from "../knowledgebases/record-knowledgebase-document";
import saveKnowledgebase from "../knowledgebases/save-knowledgebase";
import extensionItemSchema from "./extension-item-schemas";
import grabExistingExtensionItems from "./grab-existing-extension-items";
import matchExtensionItem, { type ExistingExtensionItem } from "./match-extension-item";
import normalizeExtensionConfig from "./normalize-extension-config";
import uniqueCopyName from "./unique-copy-name";

type Params = {
    bundle: ExtensionBundle;
    kind: ExtensionBundleKind;
    /**
     * What the user chose per item, by its place in the bundle. Anything
     * left out gets its default: add a new one, leave a matching one alone.
     */
    decisions: ExtensionImportDecision[];
    user_id: number;
};

/**
 * Writes what the preview promised, one item at a time. An item that can't
 * be read or saved is reported and the rest still go in; nothing here ever
 * touches access, a connection or a document's bytes.
 */
export default async function applyExtensionImport({ bundle, kind, decisions, user_id }: Params): Promise<ExtensionImportApplyPayload> {
    const existing = await grabExistingExtensionItems({ kind });
    const chosen = new Map(decisions.map((decision) => [decision.index, decision.action]));
    const outcomes: ExtensionImportOutcome[] = [];

    for (const [index, item] of bundle.items.entries()) {
        if (item.kind != kind) continue;

        outcomes.push(
            await importItem({
                index,
                item,
                action: chosen.get(index) ?? "add",
                existing,
                user_id,
            }),
        );
    }

    if (kind == "mcp") return { kind, outcomes, overview: await grabMcpsOverview({ user_id }) };
    if (kind == "tool") return { kind, outcomes, overview: await grabToolsOverview({ user_id }) };
    if (kind == "skill") return { kind, outcomes, overview: await grabSkillsOverview({ user_id }) };

    return { kind, outcomes, overview: await grabKnowledgebasesOverview({ user_id }) };
}

type ImportItemParams = {
    index: number;
    item: ExtensionBundleItem;
    action: ExtensionImportAction;
    existing: ExistingExtensionItem[];
    user_id: number;
};

async function importItem({ index, item, action, existing, user_id }: ImportItemParams): Promise<ExtensionImportOutcome> {
    const name = typeof item.config.name == "string" ? item.config.name : item.key;

    if (action == "skip") return { index, name, action, ok: true, msg: "Left alone." };

    const config = normalizeExtensionConfig({ kind: item.kind, config: item.config });

    const parsed = extensionItemSchema({ kind: item.kind }).safeParse(config);

    if (!parsed.success) {
        return { index, name, action, ok: false, msg: parsed.error.issues[0]?.message || "The item can't be read." };
    }

    const match = matchExtensionItem({ key: item.key, config, existing });
    const replace = action == "overwrite" && match.existing_id;
    /** An overwrite changes settings, never who reaches the row. */
    const keep_all_bots = !!existing.find((row) => row.id == match.existing_id)?.all_bots;
    const better = action == "copy" && !!match.existing_id;
    const taken = existing.map((row) => String(row.config.name ?? row.key));

    try {
        if (item.kind == "mcp") {
            const config = parsed.data as SaveMcpServerRequest;
            const data: SaveMcpServerRequest = {
                ...config,
                mcp_server_id: replace ? (match.existing_id as number) : undefined,
                name: better ? uniqueCopyName({ name, taken, style: "words", max_length: 80 }) : name,
                all_bots: replace ? keep_all_bots : false,
            };

            const id = await saveMcpServer({ user_id, data });
            remember({ existing, id, replace, key: data.name == config.name ? item.key : mcpServerSlug({ name: data.name }), config: data, all_bots: data.all_bots });

            return done({ index, action, name, better, copy_name: better ? data.name : "" });
        }

        if (item.kind == "tool") {
            const config = parsed.data as SaveCustomToolRequest;
            const data: SaveCustomToolRequest = {
                ...config,
                custom_tool_id: replace ? (match.existing_id as number) : undefined,
                name: better ? uniqueCopyName({ name, taken, style: "snake", max_length: 64 }) : name,
                all_bots: replace ? keep_all_bots : false,
            };

            const id = await saveCustomTool({ user_id, data });
            remember({ existing, id, replace, key: data.name, config: data, all_bots: data.all_bots });

            return done({ index, action, name, better, copy_name: better ? data.name : "" });
        }

        if (item.kind == "skill") {
            const config = parsed.data as SaveSkillRequest;
            const slugs = existing.map((row) => String(row.config.slug ?? row.key));
            const data: SaveSkillRequest = {
                ...config,
                skill_id: replace ? (match.existing_id as number) : undefined,
                name: better ? uniqueCopyName({ name, taken, style: "words", max_length: 80 }) : name,
                slug: better
                    ? uniqueCopyName({ name: config.slug, taken: slugs, style: "dash", max_length: 64 })
                    : config.slug,
                all_bots: replace ? keep_all_bots : false,
            };

            const id = await saveSkill({ user_id, data });
            remember({ existing, id, replace, key: data.slug, config: data, all_bots: data.all_bots });

            return done({ index, action, name, better, copy_name: better ? data.name : "" });
        }

        const config = parsed.data as SaveKnowledgebaseRequest;
        const data: SaveKnowledgebaseRequest = {
            ...config,
            knowledgebase_id: replace ? (match.existing_id as number) : undefined,
            name: better ? uniqueCopyName({ name, taken, style: "words", max_length: 80 }) : name,
            all_bots: replace ? keep_all_bots : false,
        };

        const id = await saveKnowledgebase({ user_id, data });
        remember({ existing, id, replace, key: data.name.toLowerCase(), config: data, all_bots: data.all_bots });

        const documents = await addDocuments({ item, knowledgebase_id: id, user_id });
        const outcome = done({ index, action, name, better, copy_name: better ? data.name : "" });

        return { ...outcome, msg: `${outcome.msg}${documents}` };
    } catch (error) {
        return { index, name, action, ok: false, msg: safeErrorMessage({ error }) };
    }
}

type DoneParams = {
    index: number;
    action: ExtensionImportAction;
    name: string;
    better: boolean;
    copy_name: string;
};

function done({ index, action, name, better, copy_name }: DoneParams): ExtensionImportOutcome {
    if (action == "overwrite") return { index, name, action, ok: true, msg: `Replaced the settings of ${name}.` };
    if (better) return { index, name, action, ok: true, msg: `Added as ${copy_name}.` };

    return { index, name, action, ok: true, msg: "Added." };
}

type RememberParams = {
    existing: ExistingExtensionItem[];
    id: number;
    replace: number | false | null;
    key: string;
    config: unknown;
    all_bots: boolean;
};

/**
 * Keeps the list being compared against current, so a file holding the same
 * key twice can't add two identical rows.
 */
function remember({ existing, id, replace, key, config, all_bots }: RememberParams) {
    const shape = config as Record<string, unknown>;

    if (replace) {
        const row = existing.find((candidate) => candidate.id == replace);

        if (row) {
            row.key = key;
            row.config = shape;
            row.all_bots = all_bots;
        }

        return;
    }

    existing.push({ id, key, config: shape, all_bots });
}

type AddDocumentsParams = {
    item: ExtensionBundleItem;
    knowledgebase_id: number;
    user_id: number;
};

/**
 * A knowledgebase's text, document by document. What lands is what a bot
 * reads; the passages and vectors are made again by the ingest worker.
 */
async function addDocuments({ item, knowledgebase_id, user_id }: AddDocumentsParams): Promise<string> {
    if (!item.documents.length) return "";

    let added = 0;
    let first_problem = "";

    for (const document of item.documents) {
        try {
            await recordKnowledgebaseDocument({
                user_id,
                knowledgebase_id,
                name: document.name,
                source: "text",
                content: document.text,
                mime_type: document.mime_type || "text/markdown",
                size: Buffer.byteLength(document.text, "utf8"),
            });

            added++;
        } catch (error) {
            first_problem ||= safeErrorMessage({ error });
        }
    }

    const counted = `${added} of ${item.documents.length} ${item.documents.length == 1 ? "document" : "documents"} added.`;

    return ` ${counted}${first_problem ? ` ${first_problem}` : ""}`;
}