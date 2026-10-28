import userAuth from "@/src/functions/backend/auth/user-auth";
import answerBotQuestion from "@/src/functions/backend/db/bot-questions/answer-bot-question";
import grabBotQuestionView from "@/src/functions/backend/db/bot-questions/grab-bot-question-view";
import { AnswerBotQuestionSchema } from "@/src/schemas/bot-question-schema";
import type { BotQuestionView } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * The session user answered questions a bot asked them in its card.
 * Answers with the questions as they now stand.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BotQuestionView>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (isReadOnlyUser({ user_types: user_types || [] })) {
            throw new AppError(`This user can only read records.`);
        }

        const { question_id, answers } = parseWithSchema({ schema: AnswerBotQuestionSchema, data: body });

        await answerBotQuestion({ question_id, user_id: user.id, answers });

        return { success: true, singleRes: await grabBotQuestionView({ question_id, user_id: user.id }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
