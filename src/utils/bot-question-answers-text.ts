import type { BotQuestionView } from "@/src/types";

type Params = {
    view: BotQuestionView;
};

/**
 * What the chat tells the bot once the user answered (or skipped) its
 * questions, so it carries on from their answers: each question with the
 * options picked and anything typed into "Other".
 */
export default function botQuestionAnswersText({ view }: Params) {
    if (view.status == "skipped" || !view.answers) {
        return `I skipped your questions (questions #${view.id}) without answering them.`;
    }

    const lines = view.questions.map((item, index) => {
        const answer = view.answers?.[index];
        const picked = (answer?.choices || []).map((choice) => item.options[choice]).filter(Boolean);
        const other = answer?.other ? `other: ${answer.other}` : "";

        return `- **${item.question}** ${[...picked, other].filter(Boolean).join("; ")}`;
    });

    return [`My answers (questions #${view.id}):`, ...lines].join("\n");
}
