import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { BotQuestionAnswer, BotQuestionView } from "@/src/types";

type Params = {
    question_id: number;
    /**
     * One per question; none skips them.
     */
    answers?: BotQuestionAnswer[];
};

/**
 * Answers questions a bot asked from their card, or skips them, returning
 * the questions as they now stand.
 */
export default async function decideBotQuestion({ question_id, answers }: Params) {
    return await fetchApi<{ question_id: number; answers?: BotQuestionAnswer[] }, APIResponseObject<BotQuestionView>>(
        `/api/admin/bot-questions/${answers ? "answer" : "skip"}-question`,
        { method: "POST", body: answers ? { question_id, answers } : { question_id } },
    );
}
