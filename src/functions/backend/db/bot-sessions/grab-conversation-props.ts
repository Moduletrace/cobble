import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import type { BotTextModel, PagePropsType } from "@/src/types";
import railBots from "@/src/utils/rail-bots";
import railWorkspaces from "@/src/utils/rail-workspaces";
import grabBots from "../bots/grab-bots";
import grabBotExtensionsOverview from "../extensions/grab-bot-extensions-overview";
import grabConversationFiles from "../bot-files/grab-conversation-files";
import grabBotComputers from "../computers/grab-bot-computers";
import resolveHarnessCandidates from "@/src/harness/resolve/resolve-harness-candidates";
import grabUserWorkspaces from "../workspaces/grab-user-workspaces";
import grabUserConversation from "./grab-user-conversation";

type Params = {
    user_id: number;
    bot_id: number | string;
    /**
     * The workspace the conversation is in; none for the bot's own chat.
     */
    workspace_id?: number | string | null;
};

/**
 * The page props of a conversation (`/admin/bots/<id>` or
 * `/admin/workspaces/<id>/bots/<id>`): the rail's crew (the workspace's
 * in a workspace) and workspaces, the bot, the text model it runs on, its
 * computers, tools, MCP servers and files there, and whether its mic and
 * read-aloud have a model to run on. The history (its session, messages
 * and active task) is left to the client (`grabConversationHistory`,
 * `api/admin/bots/conversation-history`), so a page the back button
 * restores never shows an old thread. The full model settings are left to
 * the models modal: the install-wide catalog (`api/admin/harness/catalog`)
 * and the conversation's small setting
 * (`api/admin/bots/harness-overview`). They are most of a page's weight
 * and only that modal uses them.
 * Null when the user can't chat with the bot there.
 */
export default async function grabConversationProps({
    user_id,
    bot_id,
    workspace_id,
}: Params): Promise<PagePropsType | null> {
    const conversation = await grabUserConversation({ user_id, bot_id, workspace_id }).catch(
        () => null,
    );

    if (!conversation) return null;

    const scope = conversation.workspace_id;

    const [bots, workspaces] = await Promise.all([
        grabBots({ user_id, workspace_id: scope }),
        grabUserWorkspaces({ user_id }),
    ]);

    const bot = bots.find((b) => b.id == conversation.bot.id);

    if (!bot?.id) return null;

    /** Loading its history marks the open session read. */
    bot.unread = 0;

    const [bot_text_model, bot_computers, bot_extensions, bot_files, transcription, speech] = await Promise.all([
        grabTextModel({ bot_id: bot.id, workspace_id: scope }),
        grabBotComputers({ bot_id: bot.id, workspace_id: scope }),
        grabBotExtensionsOverview({ user_id, bot_id: bot.id, workspace_id: scope }),
        grabConversationFiles({ bot_id: bot.id, workspace_id: scope }),
        hasHarnessModel({ harness: "transcription", bot_id: bot.id, workspace_id: scope }),
        hasHarnessModel({ harness: "speech", bot_id: bot.id, workspace_id: scope }),
    ]);

    return {
        bots: railBots({ bots }),
        bot: railBots({ bots: [bot] })[0],
        workspaces: railWorkspaces({ workspaces }),
        workspace: conversation.workspace ? withoutContext(conversation.workspace) : null,
        bot_text_model,
        bot_computers,
        bot_extensions,
        bot_files,
        bot_voice: { transcription, speech },
    };
}

/**
 * The open workspace without its shared context, which the conversation
 * never shows (the bot reads it from the database).
 */
function withoutContext({ system_prompt, ...workspace }: BUN_SQLITE_COBBLE_WORKSPACES) {
    return workspace;
}

/**
 * Whether the harness is on and has a model to run on for the bot there.
 */
async function hasHarnessModel(params: Parameters<typeof resolveHarnessCandidates>[0]) {
    return await resolveHarnessCandidates(params)
        .then((candidates) => candidates.length > 0)
        .catch(() => false);
}

/**
 * The first text model the bot would try there, if any.
 */
async function grabTextModel(
    params: Omit<Parameters<typeof resolveHarnessCandidates>[0], "harness">,
): Promise<BotTextModel | null> {
    const [first] = await resolveHarnessCandidates({ ...params, harness: "text" }).catch(() => []);

    if (!first) return null;

    return {
        name: first.model.name || first.model.slug,
        provider_name: first.provider.name || first.provider.kind,
    };
}
