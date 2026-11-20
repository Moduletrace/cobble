import { z } from "zod";
import createBotSuggestion from "@/src/functions/backend/db/bot-suggestions/create-bot-suggestion";
import { AppData } from "@/src/data/app-data";
import { BotSuggestionStepsSchema } from "@/src/schemas/bot-suggestion-schema";
import botSuggestionRef from "@/src/utils/bot-suggestion-ref";
import type { HarnessTool } from "../../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The conversation they show in.
     */
    session_id: number | string;
    workspace_id?: number | string | null;
    /**
     * Called with the suggestions' ref, so the message always carries
     * their buttons.
     */
    onSuggest: (params: { ref: string }) => void;
};

type Args = {
    title?: string;
    steps: z.infer<typeof BotSuggestionStepsSchema>;
};

/**
 * Offers the user concrete next steps as buttons under the bot's answer.
 * Clicking one puts it in their input; nothing waits on it, unlike
 * `ask_user`. Once per run, so every suggestion lands in one row. It shares
 * the closing turn with `send_reply` (`ClosingToolNames`): the buttons
 * belong under that answer, and a later turn would replace it.
 */
export default function suggestNextStepsTool({ user_id, bot_id, session_id, workspace_id, onSuggest }: Params): HarnessTool<Args> {
    let suggested = false;

    return {
        name: "suggest_next_steps",
        description: `Offer the user next steps they can take from here, shown as buttons under your answer: clicking one puts it in their input for them to send. Call it in the same turn as send_reply, once the work is done, so the buttons belong to the message that turn sends (your best suggestion first). A later turn cannot add them: that turn would replace the answer. This never waits for a response: don't ask the user to pick one, don't put the answers on hold. When their answer decides what you do next, use ask_user in that same turn instead. Don't suggest what they already asked for, and don't repeat the steps in your text.`,
        schema: z.object({
            title: z
                .string()
                .trim()
                .max(AppData.BotSuggestionTitleMaxChars)
                .optional()
                .describe(`A short heading for the row, e.g. "What I can do next" (defaults to "Next steps")`),
            steps: BotSuggestionStepsSchema.describe("The suggested steps, best first, each written as the message the user would send"),
        }),
        run: async ({ args }) => {
            if (suggested) {
                return `The suggested steps are already attached to your message. Finish your reply with send_reply.`;
            }

            const id = await createBotSuggestion({
                user_id,
                bot_id,
                session_id,
                workspace_id,
                title: args.title?.trim() || "",
                steps: args.steps,
            });

            suggested = true;
            onSuggest({ ref: botSuggestionRef({ id }) });

            const count = args.steps.length;

            return `Suggested ${count} next step${count == 1 ? "" : "s"}: the buttons are under your message, and clicking one puts it in the user's input. They need do nothing; don't wait for them and don't repeat the steps in your text.`;
        },
    };
}