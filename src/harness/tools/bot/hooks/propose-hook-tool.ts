import { z } from "zod";
import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import { BotHookSources, type BotHookSource } from "@/src/dict/bot-hook-dict";
import createHookProposal from "@/src/functions/backend/db/hook-proposals/create-hook-proposal";
import grabHookProposalView from "@/src/functions/backend/db/hook-proposals/grab-hook-proposal-view";
import hookProposalRef from "@/src/utils/hook-proposal-ref";
import type { HarnessTool } from "../../../types";
import describeHookProposalForBot from "./describe-hook-proposal-for-bot";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The conversation it's proposed in, where its card shows.
     */
    session_id: number | string;
    /**
     * Where the run is: a new hook runs there too.
     */
    workspace_id?: number | string | null;
    /**
     * The bot's computers where it runs, the current one first.
     */
    computers: BUN_SQLITE_COBBLE_COMPUTERS[];
    /**
     * Called with the proposal's ref, so the reply always carries its card.
     */
    onPropose: (params: { ref: string }) => void;
};

type Args = {
    hook_id?: number;
    title?: string;
    instructions?: string;
    source?: BotHookSource;
    computer_id?: number;
    watch_computer_id?: number;
    watch_filter?: string;
    enabled?: true;
    reason: string;
};

/**
 * Lets a bot propose a hook, or a change to one of its own (name, brief,
 * filter, switching it back on), for the user to confirm from a card in
 * the chat. A hook runs its brief on its own whenever something outside
 * calls it, so the user writes it off, never the bot: nothing is saved
 * until they confirm, and a new hook's URL is shown to them alone.
 */
export default function proposeHookTool({
    user_id,
    bot_id,
    session_id,
    workspace_id,
    computers,
    onPropose,
}: Params): HarnessTool<Args> {
    const listed = computers.map((computer) => `${computer.id} (${computer.name || computer.kind})`).join(", ");

    return {
        name: "propose_hook",
        description: `Propose a hook for the user to confirm: a secret URL an outside service (a webhook from GitHub, Stripe, a form, a script) calls to give you a task, or a watcher that hands you each browser notification on one of your computers (source browser_notifications, with watch_computer_id and an optional watch_filter, text the notification's site, title or body must contain). Every call queues your instructions (the brief) as a task for you, ${
            workspace_id ? "in this workspace" : "in your own chat"
        }, with what the caller sent attached as data, in this session, where the result is posted (the hook stays tied to this session even after the user starts another). Runs carry the brief out without asking the user, so write it as a full brief for a future you with no memory of this chat, saying exactly what to do with each call. ${
            computers.length ? `Your computers here: ${listed}.` : `You have no computer here, so it can't watch one.`
        } To change one of your hooks (ids from list_hooks), give hook_id and only what changes: title, instructions, watch_filter, or enabled true to switch a paused one back on; what calls it and where it runs can't change. Nothing is saved until the user presses Confirm on the card. A new hook's URL is shown to the user on the card, once: you never see it, never ask for it, and never set a signing secret (the user adds one from the Hooks menu). Check list_hooks first: if a hook already does the job, propose a change to it instead.`,
        schema: z.object({
            hook_id: z.number().int().positive().optional().describe("The hook to change; leave out for a new one"),
            title: z.string().trim().min(1).max(80).optional().describe(`A short name, e.g. "GitHub pushes"`),
            instructions: z.string().trim().min(1).max(8000).optional().describe("The brief every call runs"),
            source: z.enum(BotHookSources.map((s) => s.value) as [BotHookSource, ...BotHookSource[]]).optional(),
            computer_id: z.number().int().positive().optional().describe("The computer its runs use; leave out for your current one"),
            watch_computer_id: z.number().int().positive().optional(),
            watch_filter: z.string().trim().max(300).optional(),
            enabled: z.literal(true).optional(),
            reason: z
                .string()
                .trim()
                .min(10, "Say why you propose it")
                .max(2000)
                .describe("Why you propose it and what the user asked for, shown on the card as your words"),
        }),
        run: async ({ args }) => {
            const { hook_id, reason, ...data } = args;

            const id = await createHookProposal({
                user_id,
                bot_id,
                session_id,
                workspace_id,
                hook_id,
                data,
                reason,
            });

            onPropose({ ref: hookProposalRef({ id }) });

            return describeHookProposalForBot({ view: await grabHookProposalView({ proposal_id: id, user_id }) });
        },
    };
}
