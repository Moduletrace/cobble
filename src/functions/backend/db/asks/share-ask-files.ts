import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import copyBotFile from "../bot-files/copy-bot-file";
import grabBotFile from "../bot-files/grab-bot-file";
import grabRunScopes from "../bot-files/grab-run-scopes";
import grabBotById from "../bots/grab-bot-by-id";
import grabUserBot from "../bots/grab-user-bot";
import fileRefIds from "@/src/utils/file-ref-ids";
import rewriteFileRefs from "@/src/utils/rewrite-file-refs";
import type { StorageScope } from "@/src/utils/storage-access";

type Params = {
    ask: BUN_SQLITE_COBBLE_BOT_ASKS;
    /**
     * The answer as the asked bot wrote it.
     */
    answer: string;
};

/**
 * Copies every file an answer cites that the asking bot can't reach into
 * its own folder (`crew/ask-<id>/`), and points the refs at the copies. The
 * bytes are copied, never moved: the answer must still work for the bot that
 * wrote it. Returns the answer with its refs rewritten.
 */
export default async function shareAskFiles({ ask, answer }: Params): Promise<string> {
    const ids = fileRefIds({ text: answer }).slice(0, AppData.AskSharedFilesMax);

    if (!ids.length) return answer;

    const requester = await grabUserBot({ bot_id: ask.requester_bot_id!, user_id: ask.user_id! });
    const target = await grabBotById({ bot_id: ask.target_bot_id! });

    if (!requester?.id || !target?.id) return answer;

    const requester_scopes = await grabRunScopes({
        bot: requester,
        user_id: ask.user_id!,
        workspace_id: ask.workspace_id,
    });

    const target_scopes = await grabRunScopes({
        bot: target,
        user_id: ask.user_id!,
        workspace_id: ask.workspace_id,
    });

    const own: StorageScope = { scope: "bot", owner_id: Number(requester.id) };
    const copies = new Map<number, number>();

    for (const file_id of ids) {
        const source = await grabBotFile({ scopes: target_scopes, file_id });

        if (!source?.id) continue;

        /**
         * It already reaches that file: its own ref keeps working.
         */
        if (await grabBotFile({ scopes: requester_scopes, file_id })) continue;

        const name = source.name || source.path || `file-${source.id}`;

        const copy = await copyBotFile({
            scopes: [...requester_scopes, own],
            file_id,
            bot_id: requester.id,
            scope: own,
            path: `crew/ask-${ask.id}/${name}`,
            user_id: ask.user_id!,
        }).catch(() => null);

        if (copy?.id) copies.set(Number(file_id), Number(copy.id));
    }

    return copies.size ? rewriteFileRefs({ text: answer, ids: copies }) : answer;
}
