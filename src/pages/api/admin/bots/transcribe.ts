import userAuth from "@/src/functions/backend/auth/user-auth";
import grabActiveBotSession from "@/src/functions/backend/db/bot-sessions/grab-active-bot-session";
import grabUserConversation from "@/src/functions/backend/db/bot-sessions/grab-user-conversation";
import transcribeAudio from "@/src/harness/audio/transcribe-audio";
import withUsageScope from "@/src/harness/usage/with-usage-scope";
import { TranscribeVoiceRequestSchema } from "@/src/schemas/bot-schema";
import HarnessError from "@/src/harness/harness-error";
import AppError from "@/src/utils/app-error";
import bufferFromBase64 from "@/src/utils/buffer-from-base-64";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Recording types as the formats the harness takes.
 */
const AudioFormats: Record<string, string> = {
    mp4: "m4a",
    "x-m4a": "m4a",
    mpeg: "mp3",
    "x-wav": "wav",
    wave: "wav",
};

/**
 * Turns a composer dictation into text with the bot's transcription
 * model, for the user to edit and send. The recording isn't kept.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<{ text: string }>
> = async ({ req, body }) => {
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

        const { bot_id, workspace_id, data_url } = parseWithSchema({
            schema: TranscribeVoiceRequestSchema,
            data: body,
        });

        const conversation = await grabUserConversation({ user_id: user.id, bot_id, workspace_id });

        const type = data_url.match(/^data:audio\/([a-z0-9.+-]+)/i)?.[1]?.toLowerCase() || "webm";
        const { buffer } = await bufferFromBase64(data_url);

        if (!buffer.length) {
            throw new AppError(`Nothing was recorded.`);
        }

        /**
         * The dictation is work done for this user in this conversation,
         * even though no queued job or message is behind it.
         */
        const session = await grabActiveBotSession({
            user_id: user.id,
            bot_id: conversation.bot.id,
            workspace_id: conversation.workspace_id,
        });

        const text = await withUsageScope({
            scope: {
                user_id: user.id,
                bot_id: conversation.bot.id,
                workspace_id: conversation.workspace_id,
                session_id: session?.id || null,
                job_id: null,
                message_id: null,
            },
            task: () =>
                transcribeAudio({
                    audio: { data: new Uint8Array(buffer), format: AudioFormats[type] || type },
                    bot_id: conversation.bot.id,
                    workspace_id: conversation.workspace_id,
                }),
        });

        if (!text) {
            throw new AppError(`No speech was heard. Try again a little closer to the mic.`);
        }

        return { success: true, singleRes: { text } };
    } catch (error: unknown) {
        return {
            success: false,
            msg: error instanceof HarnessError ? error.message : safeErrorMessage({ error }),
        };
    }
};
