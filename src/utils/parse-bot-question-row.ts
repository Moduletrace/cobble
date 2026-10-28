import type { BotQuestionAnswer, BotQuestionItem } from "@/src/types";

type Params = {
    row: { questions?: string | null; answers?: string | null };
};

/**
 * A `bot_questions` row's stored JSON read back: its questions (none if
 * unreadable) and its answers (null until answered, or when they don't
 * match the questions).
 */
export default function parseBotQuestionRow({ row }: Params): {
    questions: BotQuestionItem[];
    answers: BotQuestionAnswer[] | null;
} {
    const questions = parseJson<BotQuestionItem[]>({ text: row.questions });
    const answers = parseJson<BotQuestionAnswer[]>({ text: row.answers });
    const final_questions = Array.isArray(questions) ? questions : [];

    return {
        questions: final_questions,
        answers: Array.isArray(answers) && answers.length == final_questions.length ? answers : null,
    };
}

function parseJson<T>({ text }: { text?: string | null }): T | null {
    if (!text) return null;

    try {
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
}
