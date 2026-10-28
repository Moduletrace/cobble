import { z } from "zod";
import createBotQuestion from "@/src/functions/backend/db/bot-questions/create-bot-question";
import { BotQuestionItemsSchema } from "@/src/schemas/bot-question-schema";
import botQuestionRef from "@/src/utils/bot-question-ref";
import type { HarnessTool } from "../../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The conversation they're asked in, where their card shows.
     */
    session_id: number | string;
    workspace_id?: number | string | null;
    /**
     * Whether the run is a task, which stops and reports rather than waits.
     */
    in_task?: boolean;
    /**
     * Called with the questions' ref, so the message always carries their
     * card.
     */
    onAsk: (params: { ref: string }) => void;
};

type Args = {
    title?: string;
    questions: z.infer<typeof BotQuestionItemsSchema>;
};

/**
 * Lets a bot make sure of what the user wants before it acts: it asks a
 * few multiple-choice questions, the user answers them in a card (radios
 * for one pick, checkboxes for several, "Other" to type their own), and
 * the answers come back as the user's next message. Once per run, so every
 * question goes on one card.
 */
export default function askUserTool({ user_id, bot_id, session_id, workspace_id, in_task, onAsk }: Params): HarnessTool<Args> {
    let asked = false;

    return {
        name: "ask_user",
        description: `Ask the user multiple-choice questions to be sure what they want before you act, shown as a card in the chat they answer by picking options. Use it when the request is ambiguous or open to more than one reading, when a choice is theirs to make (which target, which items, how far to go), or before something that is hard to undo, costly or visible to others, and you can't tell what they'd pick. Don't ask what they already told you, what you can find out yourself, or what any sensible choice would settle. Put every question in one call (at most one per reply). Their answers arrive as their next message${
            in_task ? `. In a task, ask, then stop and report that you're waiting for their answers.` : `: after asking, end your reply and wait; don't act on what you asked about until they answer.`
        }`,
        schema: z.object({
            title: z.string().trim().max(120).optional().describe("A short heading for the card, e.g. \"Before I deploy\""),
            questions: BotQuestionItemsSchema.describe("The questions, in the order to answer them"),
        }),
        run: async ({ args }) => {
            if (asked) {
                throw new Error(`You already asked the user in this run. Put every question in one ask_user call, then wait for their answers.`);
            }

            const id = await createBotQuestion({
                user_id,
                bot_id,
                session_id,
                workspace_id,
                title: args.title?.trim() || "",
                questions: args.questions.map((item) => ({
                    question: item.question,
                    kind: item.kind,
                    options: item.options,
                    allow_other: Boolean(item.allow_other),
                })),
            });

            asked = true;
            onAsk({ ref: botQuestionRef({ id }) });

            const count = args.questions.length;

            return `Asked the user ${count} question${count == 1 ? "" : "s"}: the card is on your message. ${
                in_task
                    ? `Stop here and report that you're waiting for their answers.`
                    : `End your reply now with a short line saying what you need settled; their answers arrive as their next message.`
            } Don't repeat the questions or options in your text.`;
        },
    };
}
