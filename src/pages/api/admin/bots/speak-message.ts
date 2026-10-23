import userAuth from "@/src/functions/backend/auth/user-auth";
import grabSpeakableMessage from "@/src/functions/backend/db/bots/grab-speakable-message";
import speakText from "@/src/harness/audio/speak-text";
import withUsageScope from "@/src/harness/usage/with-usage-scope";
import HarnessError from "@/src/harness/harness-error";
import { SpeakBotMessageRequestSchema } from "@/src/schemas/bot-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import speechText from "@/src/utils/speech-text";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * `GET ?message_id=`: reads one of the bot's messages in the user's own
 * conversation aloud with the bot's speech model and voice, streamed as
 * the provider makes it, so an `<audio>` pointed here starts playing
 * within a couple of seconds. Closing the player stops the provider call.
 * Nothing is stored; the browser may keep it for an hour.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({ req, query }) => {
    try {
        if (req.method != "GET") {
            throw new AppError(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { message_id } = parseWithSchema({
            schema: SpeakBotMessageRequestSchema,
            data: query,
        });

        const { message, conversation } = await grabSpeakableMessage({
            user_id: Number(user.id),
            message_id,
        });

        const text = speechText({ text: message.text || "" });

        if (!text) {
            throw new AppError(`There's nothing to read in that message.`);
        }

        /**
         * Reading a message aloud is billed like any other model call, so
         * it is recorded against the message it reads.
         */
        const audio = await withUsageScope({
            scope: {
                user_id: user.id,
                bot_id: conversation.bot.id,
                workspace_id: conversation.workspace_id,
                session_id: message.session_id || null,
                job_id: null,
                message_id: message.id || null,
            },
            task: () =>
                speakText({
                    text,
                    bot_id: conversation.bot.id,
                    workspace_id: conversation.workspace_id,
                    signal: req.signal,
                }),
        });

        return new Response(audio.stream, {
            headers: {
                "Content-Type": audio.media_type,
                "Cache-Control": "private, max-age=3600",
            },
        });
    } catch (error: unknown) {
        return {
            success: false,
            msg: error instanceof HarnessError ? error.message : safeErrorMessage({ error }),
        };
    }
};
