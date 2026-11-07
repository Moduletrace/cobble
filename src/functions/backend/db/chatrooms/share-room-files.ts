import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_SESSIONS, BUN_SQLITE_COBBLE_CHATROOMS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import { logError } from "@/src/functions/backend/logger";
import fileRefIds from "@/src/utils/file-ref-ids";
import rewriteFileRefs from "@/src/utils/rewrite-file-refs";
import type { StorageScope } from "@/src/utils/storage-access";
import copyBotFile from "../bot-files/copy-bot-file";
import grabBotFile from "../bot-files/grab-bot-file";
import grabRunScopes from "../bot-files/grab-run-scopes";
import grabBotById from "../bots/grab-bot-by-id";

type Params = {
    chatroom: Pick<BUN_SQLITE_COBBLE_CHATROOMS, "id" | "user_id" | "workspace_id" | "requester_bot_id">;
    /**
     * The coordinator's answer, as it would be sent.
     */
    answer: string;
};

/**
 * Makes the files a room's answer names readable by the bot that asked.
 * A bot asked in a room saves to its own folder, which the asker can't
 * read, so an answer citing `[file:330]` sent the asker back to the crew
 * for the same files twice more. Each cited file the asker doesn't reach
 * but a bot in the room does is copied into the asker's own folder under
 * `crew/room-<id>/` (the bytes, so the member's folder stays its own), and
 * the ref is pointed at the copy. Files the asker already reaches, and
 * files no bot in the room reaches, are left as they are. A copy that
 * fails keeps the original ref, and the answer still goes out.
 */
export default async function shareRoomFiles({ chatroom, answer }: Params) {
    const ids = fileRefIds({ text: answer }).slice(0, AppData.ChatroomSharedFilesMax);
    const requester = chatroom.requester_bot_id ? await grabBotById({ bot_id: chatroom.requester_bot_id }) : null;

    if (!ids.length || !requester?.id || !chatroom.user_id) return answer;

    const place = { user_id: chatroom.user_id, workspace_id: chatroom.workspace_id || null };
    const requester_scopes = await grabRunScopes({ bot: requester, ...place });
    const own: StorageScope = { scope: "bot", owner_id: Number(requester.id) };
    const member_scopes = await grabMemberScopes({ chatroom, requester_id: Number(requester.id), place });
    const copies = new Map<number, number>();

    for (const file_id of ids) {
        if (await grabBotFile({ scopes: requester_scopes, file_id })) continue;

        const source = await findReachingScopes({ member_scopes, file_id });

        if (!source) continue;

        try {
            const copy = await copyBotFile({
                scopes: [...source.scopes, own],
                file_id,
                bot_id: requester.id,
                scope: own,
                path: `crew/room-${chatroom.id}/${source.name}`,
                user_id: chatroom.user_id,
            });

            if (copy?.id) copies.set(file_id, Number(copy.id));
        } catch (error: unknown) {
            await logError({
                title: `Couldn't copy a crew answer's file for the bot that asked`,
                error,
                user_id: Number(chatroom.user_id),
                metadata: { chatroom_id: chatroom.id, file_id, bot_id: requester.id },
            });
        }
    }

    return rewriteFileRefs({ text: answer, ids: copies });
}

/**
 * The folders each bot asked in the room reaches there, for its user and
 * place (never the coordinator's or the asker's own).
 */
async function grabMemberScopes({
    chatroom,
    requester_id,
    place,
}: {
    chatroom: Params["chatroom"];
    requester_id: number;
    place: { user_id: number | string; workspace_id: number | string | null };
}) {
    const sessions = (
        await BunSQLite.sql<Pick<BUN_SQLITE_COBBLE_BOT_SESSIONS, "bot_id">>({
            sql: `SELECT DISTINCT bot_id FROM bot_sessions WHERE chatroom_id = ? AND bot_id != ?`,
            values: [Number(chatroom.id), requester_id],
        })
    ).payload || [];

    const scopes: StorageScope[][] = [];

    for (const session of sessions) {
        const bot = await grabBotById({ bot_id: session.bot_id! });

        if (!bot?.id || bot.kind == "coordinator") continue;

        scopes.push(await grabRunScopes({ bot, ...place }));
    }

    return scopes;
}

/**
 * The first member's folders that reach a file, with the file's name for
 * its copy.
 */
async function findReachingScopes({ member_scopes, file_id }: { member_scopes: StorageScope[][]; file_id: number }) {
    for (const scopes of member_scopes) {
        const file = await grabBotFile({ scopes, file_id });

        if (file?.id) {
            return { scopes, name: (file.path || file.name || `file-${file_id}`).split("/").pop() || `file-${file_id}` };
        }
    }

    return null;
}
