import { z } from "zod";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import assertUserAsked from "@/src/functions/backend/db/bots/assert-user-asked";
import grabCrewWorkers from "@/src/functions/backend/db/bots/grab-crew-workers";
import addBotToComputer from "@/src/functions/backend/db/computers/add-bot-to-computer";
import removeBotFromComputer from "@/src/functions/backend/db/computers/remove-bot-from-computer";
import computerRef from "@/src/utils/computer-ref";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The conversation the reply answers: the user's messages in it are
     * what a call's quote is checked against.
     */
    session_id?: number | string;
    /**
     * The user's worker bots.
     */
    workers: BUN_SQLITE_COBBLE_BOTS[];
    /**
     * Every computer the user has (the coordinator's).
     */
    computers: BUN_SQLITE_COBBLE_COMPUTERS[];
    /**
     * Each worker's computers now, by bot id, for the description.
     */
    access: Record<number, BUN_SQLITE_COBBLE_COMPUTERS[]>;
};

type Args = {
    bot_id: number;
    computer_id: number;
    access: "grant" | "revoke";
    because: string;
};

/**
 * Lets the coordinator give a crew member direct access to one of the
 * user's computers (`bot_computers`), or take it away. The computers of
 * the workspaces a bot is attached to are its own too, in its own chat as
 * well as in the workspace.
 */
export default function assignComputerTool({
    user_id,
    session_id,
    workers,
    computers,
    access,
}: Params): HarnessTool<Args> {
    const crew = workers
        .map((bot) => {
            const has = access[bot.id || 0] || [];
            return `${bot.id}: ${bot.name} (${has.length ? has.map((c) => computerRef({ id: c.id || 0 })).join(", ") : "no computer"})`;
        })
        .join("; ");

    return {
        name: "assign_computer",
        description: `Give a crew member access to a computer, or take it away. A bot works on its computers and its delegated tasks run on the one it's on. Only do it when the user asks for it. Pass their own words in because; a quote they didn't write in this conversation is refused. Crew and their computers now: ${crew}. Computers: ${computers
            .map((c) => `${computerRef({ id: c.id || 0 })} ${c.name || "Computer"}`)
            .join(", ")}.`,
        schema: z.object({
            bot_id: z.number().int(),
            computer_id: z.number().int(),
            access: z.enum(["grant", "revoke"]),
            because: z.string().min(1).describe("The user's own words asking for this, quoted from their message."),
        }),
        run: async ({ args }) => {
            await assertUserAsked({
                session_id,
                because: args.because,
                action: "give a bot a computer or take one away",
            });

            const fresh = await grabCrewWorkers();
            const worker = fresh.find((bot) => bot.id == args.bot_id);
            const computer = computers.find((c) => c.id == args.computer_id);

            if (!worker?.id) {
                throw new Error(
                    `No crew member has id ${args.bot_id}. Crew: ${fresh
                        .map((bot) => `${bot.id}: ${bot.name}`)
                        .join("; ") || "none"}.`,
                );
            }

            if (!computer?.id) {
                throw new Error(`No computer has id ${args.computer_id}.`);
            }

            const ref = computerRef({ id: computer.id });

            if (args.access == "grant") {
                await addBotToComputer({ user_id, bot_id: worker.id, computer_id: computer.id });
                return `${worker.name} can use ${ref} now.`;
            }

            await removeBotFromComputer({ user_id, bot_id: worker.id, computer_id: computer.id });

            return `${worker.name} can't use ${ref} directly any more. A workspace it's attached to may still give it.`;
        },
    };
}
