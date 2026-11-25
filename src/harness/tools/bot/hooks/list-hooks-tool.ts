import { z } from "zod";
import grabBotHooks from "@/src/functions/backend/db/bot-hooks/grab-bot-hooks";
import botRef from "@/src/utils/bot-ref";
import describeBotHook from "@/src/utils/describe-bot-hook";
import type { HarnessTool } from "../../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The coordinator reaches every bot the user has, so it lists the whole
     * crew's hooks, not only its own.
     */
    is_coordinator?: boolean;
    /**
     * The workspace the run is in: only the hooks that run there.
     */
    workspace_id?: number | string | null;
};

type Args = {
    bot_id?: number;
};

/**
 * Lets a bot see the user's hooks it runs, everywhere it works, never
 * their URLs. The coordinator sees the crew's, each naming the bot that
 * runs it. In a workspace only that workspace's hooks are in reach.
 */
export default function listHooksTool({ user_id, bot_id, is_coordinator, workspace_id }: Params): HarnessTool<Args> {
    return {
        name: "list_hooks",
        description: is_coordinator
            ? `List ${workspace_id ? "the hooks that run in this workspace, on any of its bots" : "the hooks that give the user's bots work"}: id, name, which bot runs it, what calls it (an outside service at its secret URL, or browser notifications on a computer), where it runs, whether it's paused, its runs, last call and last error. Pass bot_id to see only one bot's. To see what calls sent and what the runs answered, use search_hook_calls. You never see a hook's URL: only the user does. This is a list, not a census of the install: give what it holds and never conclude from it that a hook does not exist.`
            : `List the hooks ${workspace_id ? "that run in this workspace and give you work" : "that give you work"}: id, name, what calls it (an outside service at its secret URL, or browser notifications on a computer), where it runs, whether it's paused, its runs, last call and last error.${workspace_id ? " Nothing outside this workspace is in reach." : " Only the ones that run as you: another bot's hooks are not in this list, so never say the user has no hook from it, since they may have one on another bot."} To see what calls sent and what your runs answered, use search_hook_calls. You never see a hook's URL: only the user does.`,
        schema: is_coordinator
            ? z.object({
                  bot_id: z.number().int().positive().optional().describe("Only this bot's hooks"),
              })
            : z.strictObject({}),
        run: async ({ args }) => {
            const hooks = await grabBotHooks({
                user_id,
                ...(is_coordinator
                    ? { ...(args.bot_id ? { bot_id: args.bot_id } : {}), ...(workspace_id ? { workspace_id } : {}) }
                    : { bot_id, ...(workspace_id ? { workspace_id } : {}) }),
            });

            if (!hooks.length) {
                if (is_coordinator) {
                    if (args.bot_id) return `Bot ${botRef({ id: args.bot_id })} has no hooks${workspace_id ? " in this workspace" : ""}.`;

                    return workspace_id ? `There are no hooks in this workspace.` : `The user's crew has no hooks.`;
                }

                return workspace_id
                    ? `There are no hooks in this workspace. Hooks elsewhere aren't in this list.`
                    : `You have no hooks of your own. Other bots' hooks aren't in this list.`;
            }

            return hooks
                .map((hook) =>
                    is_coordinator
                        ? `- ${botRef({ id: Number(hook.bot_id) })} ${hook.bot_name}: ${describeBotHook({ hook, owner: hook.bot_name || undefined })}`
                        : `- ${describeBotHook({ hook })}`,
                )
                .join("\n");
        },
    };
}