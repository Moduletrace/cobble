import type { HookProposalAction } from "@/src/dict/bot-hook-dict";
import type { HookProposalData } from "@/src/schemas/bot-hook-schema";
import type { BotHookWithNames } from "@/src/types";
import AppError from "@/src/utils/app-error";
import grabUserConversation from "../bot-sessions/grab-user-conversation";
import assertHookComputers from "../bot-hooks/assert-hook-computers";
import assertHookRoom from "../bot-hooks/assert-hook-room";
import grabBotHooks from "../bot-hooks/grab-bot-hooks";
import grabUserBotHook from "../bot-hooks/grab-user-bot-hook";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The conversation's workspace, where a new hook runs; null for the
     * bot's own chat.
     */
    workspace_id?: number | string | null;
    /**
     * The hook it changes; none for a new one.
     */
    hook_id?: number | string | null;
    data: HookProposalData;
};

export type CheckedHookProposal = {
    action: HookProposalAction;
    title: string;
    /**
     * For a new hook all of it; for a change only what differs from the
     * hook now.
     */
    data: HookProposalData;
    current: BotHookWithNames | null;
};

/**
 * Checks a hook a bot proposes, when it proposes and again on confirm. A
 * change is to one of this user's hooks of this bot, and only to its
 * name, brief, filter, or switching it back on: what calls it and where
 * it runs stay. A new one runs in the conversation it's proposed in, has
 * a name and brief, isn't a second one of the same name there, fits the
 * bot's limit, and uses only computers the bot reaches there (and, to
 * watch one, the user too). Throws why when it can't.
 */
export default async function checkHookProposal({
    user_id,
    bot_id,
    workspace_id,
    hook_id,
    data,
}: Params): Promise<CheckedHookProposal> {
    if (hook_id) {
        const current = await grabUserBotHook({ user_id, hook_id });

        if (String(current.bot_id) != String(bot_id)) {
            throw new AppError(`Hook #${hook_id} isn't one of yours.`);
        }

        if (data.source !== undefined || data.computer_id !== undefined || data.watch_computer_id !== undefined) {
            throw new AppError(
                `What calls a hook and where it runs can't be changed. Propose a new hook instead, then delete this one once the user confirmed it.`,
            );
        }

        const watching = current.source == "browser_notifications";

        if (data.watch_filter !== undefined && !watching) {
            throw new AppError(`Only a browser-notification hook has a filter.`);
        }

        const changes: HookProposalData = {};

        if (data.title !== undefined && data.title != current.title) changes.title = data.title;
        if (data.instructions !== undefined && data.instructions != current.instructions) {
            changes.instructions = data.instructions;
        }
        if (data.watch_filter !== undefined && data.watch_filter.trim() != (current.watch_filter || "")) {
            changes.watch_filter = data.watch_filter.trim();
        }
        if (data.enabled && !current.enabled) changes.enabled = true;

        if (!Object.keys(changes).length) {
            throw new AppError(
                data.enabled && current.enabled
                    ? `Hook #${current.id} is already on, and nothing else would change.`
                    : `That changes nothing on hook #${current.id}.`,
            );
        }

        return { action: "change", title: changes.title || current.title || "", data: changes, current };
    }

    if (!data.title || !data.instructions) {
        throw new AppError(`A new hook needs a title and instructions (the brief each call runs).`);
    }

    const source = data.source == "browser_notifications" ? "browser_notifications" : "url";

    if (source == "url" && (data.watch_computer_id || data.watch_filter)) {
        throw new AppError(`Only a browser-notification hook watches a computer or has a filter.`);
    }

    const conversation = await grabUserConversation({ user_id, bot_id, workspace_id });

    await assertHookRoom({ user_id, bot_id: conversation.bot.id, bot_name: conversation.bot.name });

    const here = await grabBotHooks({ user_id, bot_id: conversation.bot.id, workspace_id: conversation.workspace_id });
    const same = here.find((hook) => (hook.title || "").toLowerCase() == data.title!.toLowerCase());

    if (same) {
        throw new AppError(`There's already hook #${same.id} "${same.title}" here. Propose a change to it instead.`);
    }

    await assertHookComputers({
        user_id,
        bot_id: conversation.bot.id,
        workspace_id: conversation.workspace_id,
        source,
        computer_id: data.computer_id,
        watch_computer_id: data.watch_computer_id,
    });

    return {
        action: "create",
        title: data.title,
        data: {
            title: data.title,
            instructions: data.instructions,
            source,
            computer_id: data.computer_id || null,
            watch_computer_id: source == "browser_notifications" ? data.watch_computer_id || null : null,
            watch_filter: source == "browser_notifications" ? data.watch_filter?.trim() || "" : undefined,
        },
        current: null,
    };
}
