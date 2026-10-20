import type { BotTextModel, PagePropsType } from "@/src/types";
import grabBots from "../bots/grab-bots";
import grabActiveBotTask from "../bots/grab-active-bot-task";
import grabBotMessages from "../bots/grab-bot-messages";
import grabBotExtensionsOverview from "../extensions/grab-bot-extensions-overview";
import grabBotComputers from "../computers/grab-bot-computers";
import resolveHarnessCandidates from "@/src/harness/resolve/resolve-harness-candidates";
import grabUserWorkspaces from "../workspaces/grab-user-workspaces";
import ensureBotSession from "./ensure-bot-session";
import grabUserConversation from "./grab-user-conversation";
import markBotSessionRead from "./mark-bot-session-read";

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
 * in a workspace) and workspaces, the bot, its active session (marked
 * read) and its messages, the text model it runs on, its computers,
 * tools and MCP servers and active task there, and whether its mic and
 * read-aloud have a model to run on. The full model settings are left to
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
    const session = await ensureBotSession({ user_id, bot_id: conversation.bot.id, workspace_id: scope });

    if (session.unread) {
        await markBotSessionRead({ session_id: session.id!, user_id });
        session.unread = 0;
    }

    const [bots, workspaces] = await Promise.all([
        grabBots({ user_id, workspace_id: scope }),
        grabUserWorkspaces({ user_id }),
    ]);

    const bot = bots.find((b) => b.id == conversation.bot.id);

    if (!bot?.id) return null;

    bot.unread = 0;

    const [bot_messages, bot_text_model, bot_computers, bot_task, bot_extensions, transcription, speech] = await Promise.all([
        grabBotMessages({ session_id: session.id!, user_id }),
        grabTextModel({ bot_id: bot.id, workspace_id: scope }),
        grabBotComputers({ bot_id: bot.id, workspace_id: scope }),
        grabActiveBotTask({ bot_id: bot.id, session_id: session.id }),
        grabBotExtensionsOverview({ user_id, bot_id: bot.id, workspace_id: scope }),
        hasHarnessModel({ harness: "transcription", bot_id: bot.id, workspace_id: scope }),
        hasHarnessModel({ harness: "speech", bot_id: bot.id, workspace_id: scope }),
    ]);

    return {
        bots,
        bot,
        workspaces,
        workspace: conversation.workspace,
        bot_session: session,
        bot_messages,
        bot_text_model,
        bot_computers,
        bot_task,
        bot_extensions,
        bot_voice: { transcription, speech },
    };
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
