import { z } from "zod";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import addBotToComputer from "@/src/functions/backend/db/computers/add-bot-to-computer";
import grabBotComputers from "@/src/functions/backend/db/computers/grab-bot-computers";
import removeBotFromComputer from "@/src/functions/backend/db/computers/remove-bot-from-computer";
import computerRef from "@/src/utils/computer-ref";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
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
};

/**
 * Lets the coordinator give a crew member access to one of the user's
 * computers (`bot_computers`), or take a direct grant away. Access that
 * comes through a workspace stays, and the result says so.
 */
export default function assignComputerTool({
    user_id,
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
        description: `Give a crew member access to a computer, or take it away. A bot works on its computers and its delegated tasks run on the one it's on. Crew and their computers now: ${crew}. Computers: ${computers
            .map((c) => `${computerRef({ id: c.id || 0 })} ${c.name || "Computer"}`)
            .join(", ")}.`,
        schema: z.object({
            bot_id: z.number().int(),
            computer_id: z.number().int(),
            access: z.enum(["grant", "revoke"]),
        }),
        run: async ({ args }) => {
            const worker = workers.find((bot) => bot.id == args.bot_id);
            const computer = computers.find((c) => c.id == args.computer_id);

            if (!worker?.id) {
                throw new Error(`No crew member has id ${args.bot_id}.`);
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

            const still = (await grabBotComputers({ bot_id: worker.id, user_id })).some(
                (c) => c.id == computer.id,
            );

            return still
                ? `Removed ${worker.name}'s own access to ${ref}, but it still has it through a workspace.`
                : `${worker.name} can't use ${ref} any more.`;
        },
    };
}
