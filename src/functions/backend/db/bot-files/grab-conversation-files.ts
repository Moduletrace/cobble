import { AppData } from "@/src/data/app-data";
import type { BotFileScopesPayload } from "@/src/types";
import grabMediaURL from "../../media/grab-media-url";
import grabBotFileQuotaBytes, { grabBotFileQuotaMb } from "./grab-bot-file-quota-bytes";
import grabStorageUsage from "./grab-storage-usage";
import listBotFiles from "./list-bot-files";

type Params = {
    bot_id: number;
    /**
     * The workspace the conversation is in: its shared folder, else the
     * bot's own.
     */
    workspace_id?: number | string | null;
};

/**
 * A conversation's files, for its page props: the folder it works in
 * (a workspace's shared one, else the bot's own), its latest
 * `AppData.BotFilesPageSize` of them, and the usage against the quota.
 * The full list (folders, search, older files) loads in the files modal.
 *
 * It takes the whole folder tree, not just its top level: a bot saves into
 * paths like `reports/` or `seo/coderank/`, and a file chip in a message
 * can only find the file it names among these, so a top-level-only list
 * left every nested `[file:ID]` unclickable plain text in the chat.
 */
export default async function grabConversationFiles({
    bot_id,
    workspace_id,
}: Params): Promise<BotFileScopesPayload> {
    const scope = workspace_id
        ? ({ scope: "workspace", owner_id: Number(workspace_id) } as const)
        : ({ scope: "bot", owner_id: Number(bot_id) } as const);

    const [files, usage, quota_bytes, quota_mb] = await Promise.all([
        listBotFiles({ scopes: [scope], recursive: true, limit: AppData.BotFilesPageSize }),
        grabStorageUsage(scope),
        grabBotFileQuotaBytes(),
        grabBotFileQuotaMb(),
    ]);

    return {
        files: files.map((file) => {
            const { media_url } = grabMediaURL({ media: { id: file.media_id } as any });

            return {
                id: Number(file.id),
                name: file.name || "",
                path: file.path || "",
                size: Number(file.size) || 0,
                media_type: String(file.media_type || "document"),
                purpose: String(file.purpose || "writing"),
                scope: String(file.scope || "bot"),
                owner_id: Number(file.owner_id) || 0,
                ingested_at: file.ingested_at ? Number(file.ingested_at) : undefined,
                ingest_error: file.ingest_error || undefined,
                created_at: Number(file.created_at) || 0,
                url: media_url || "",
            };
        }),
        folders: [],
        usage,
        quota_bytes,
        quota_mb,
    };
}
