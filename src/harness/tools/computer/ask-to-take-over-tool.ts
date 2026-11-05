import { z } from "zod";
import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import { ComputerViewModes, type ComputerViewMode } from "@/src/dict/computer-dict";
import { HelpPath, HelpSignInTopicId } from "@/src/dict/help-dict";
import takeOverRef from "@/src/utils/take-over-ref";
import type { HarnessTool } from "../../types";

type Params = {
    /**
     * The bot's computers, the one to default to first.
     */
    computers: BUN_SQLITE_COBBLE_COMPUTERS[];
    /**
     * In a task the bot stops and reports; in chat it says so in its reply.
     */
    in_task?: boolean;
    /**
     * Called with the take-over ref, which the bot's message must carry
     * (`withTakeOverRefs`).
     */
    onAsk: (params: { ref: string }) => void;
};

type Args = {
    computer_id?: number;
    mode?: ComputerViewMode;
};

/**
 * The views the user is sure to be able to open (not the crew-only shell).
 */
const Modes = ComputerViewModes.filter((m) => !m.crew_only).map((m) => m.value) as [ComputerViewMode, ...ComputerViewMode[]];

/**
 * Lets a bot ask the user to take over one of its computers, for what
 * only they can do there (a login, a captcha, a code). Their message
 * gets a button that opens the computer (its browser's live view), and the bot shows
 * needs-you until they hand it back in chat.
 */
export default function askToTakeOverTool({ computers, in_task, onAsk }: Params): HarnessTool<Args> {
    const listed = computers
        .map((computer) => `${computer.id} (${computer.name || computer.kind})`)
        .join(", ");

    return {
        name: "ask_user_to_take_over",
        description: `Ask the user to take over one of your computers when only they can do something on it: log in, solve a captcha, enter a code, approve a prompt, or show you something. They get a button that opens the computer's browser live, the tab you're on in front, where they can click, type and paste. Leave the page they need open. When a site still refuses to sign in on the computer, point the user to the guide at ${HelpPath}#${HelpSignInTopicId}: they bring their session over from their own browser with the view's Import cookies. Computers: ${listed}. Defaults to ${computers[0]?.id}.`,
        schema: z.object({
            computer_id: z.number().int().optional(),
            mode: z.enum(Modes).optional(),
        }),
        run: async ({ args }) => {
            const computer =
                computers.find((c) => c.id == args.computer_id) || (args.computer_id ? null : computers[0]);

            if (!computer?.id) {
                throw new Error(`You have no computer with id ${args.computer_id}. Computers: ${listed}.`);
            }

            const ref = takeOverRef({ id: computer.id, mode: args.mode || Modes[0] });

            onAsk({ ref });

            return in_task
                ? `Asked; the take-over button ${ref} is added to your report. Stop working now and finish with the report: what you've done so far and exactly what the user needs to do on the computer. When they hand it back they'll tell you in chat, and you carry on from there.`
                : `Asked; the take-over button ${ref} is added to your reply. Tell the user in a sentence or two exactly what to do on the computer. They'll tell you here when they hand it back; carry on then.`;
        },
    };
}
