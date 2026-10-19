import userAuth from "@/src/functions/backend/auth/user-auth";
import grabModelCandidate from "@/src/functions/backend/db/harness/grab-model-candidate";
import { AppData } from "@/src/data/app-data";
import { pickVoice } from "@/src/harness/audio/speak-text";
import HarnessError from "@/src/harness/harness-error";
import grabHarnessAdapter from "@/src/harness/providers/grab-harness-adapter";
import { PreviewVoiceRequestSchema } from "@/src/schemas/harness-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * `GET ?model_id=&voice=`: a short sample (`AppData.VoicePreviewText`) in
 * a speech model and voice, picked or not, streamed for an `<audio>`, so
 * a voice can be heard before it's saved. For super admins and admins,
 * who set speech models. No fallback: it's that model or an error.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({ req, query }) => {
    try {
        if (req.method != "GET") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (!canManageCrew({ user_types })) {
            throw new AppError(`Only admins can try voices.`);
        }

        const { model_id, voice } = parseWithSchema({
            schema: PreviewVoiceRequestSchema,
            data: query,
        });

        const candidate = await grabModelCandidate({ model_id, harness: "speech" });

        const audio = await grabHarnessAdapter({ kind: candidate.provider.kind }).speak({
            candidate,
            text: AppData.VoicePreviewText,
            voice: pickVoice({ candidate, voice }),
            signal: req.signal,
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
