import type { BotHarnessOverviewPayload } from "@/src/types";
import grabBotHarnessOverview from "./grab-bot-harness-overview";
import grabHarnessOverview from "./grab-harness-overview";

type Params = {
    /**
     * A bot the caller has checked the session user chats with there.
     */
    bot: { id?: number; kind?: string | null };
    workspace_id?: number | null;
};

/**
 * What a conversation's models modal edits: a worker's own settings, or
 * for the coordinator the defaults it runs on (without the providers). In
 * a workspace the workspace's own models come first, so what runs now
 * shows its pick.
 */
export default async function grabConversationHarnessOverview({
    bot,
    workspace_id,
}: Params): Promise<BotHarnessOverviewPayload> {
    if (bot.kind == "coordinator" && !workspace_id) {
        const { harnesses } = await grabHarnessOverview();

        return { harnesses };
    }

    return await grabBotHarnessOverview({
        bot_id: bot.kind == "coordinator" ? undefined : bot.id,
        workspace_id: workspace_id || undefined,
    });
}
