import type { PagePropsType } from "@/src/types";
import grabBots from "../bots/grab-bots";
import grabActiveBotTask from "../bots/grab-active-bot-task";
import grabBotMessages from "../bots/grab-bot-messages";
import grabBotComputers from "../computers/grab-bot-computers";
import grabBotHarnessOverview from "../harness/grab-bot-harness-overview";
import grabHarnessOverview from "../harness/grab-harness-overview";
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
 * read) and its messages, its models, computers and active task there.
 * Null when the bot isn't the user's or isn't in the workspace.
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
    const session = await ensureBotSession({ bot_id: conversation.bot.id, workspace_id: scope });

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

    /**
     * The header's models modal: a worker's own settings, or for the
     * coordinator the defaults it runs on (without the providers). In a
     * workspace the workspace's own models come first, so what runs now
     * shows its pick.
     */
    const [bot_messages, bot_harness_overview, bot_computers, bot_task] = await Promise.all([
        grabBotMessages({ session_id: session.id! }),
        (bot.kind == "coordinator" && !scope
            ? grabHarnessOverview().then(({ harnesses }) => ({ harnesses }))
            : grabBotHarnessOverview({
                  bot_id: bot.kind == "coordinator" ? undefined : bot.id,
                  workspace_id: scope || undefined,
              })
        ).catch(() => null),
        grabBotComputers({ bot_id: bot.id, user_id, workspace_id: scope }),
        grabActiveBotTask({ bot_id: bot.id, session_id: session.id }),
    ]);

    return {
        bots,
        bot,
        workspaces,
        workspace: conversation.workspace,
        bot_session: session,
        bot_messages,
        bot_harness_overview,
        bot_computers,
        bot_task,
    };
}
