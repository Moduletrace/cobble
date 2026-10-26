import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabSessionLengthOverview from "@/src/functions/backend/db/app-settings/grab-bot-session-max-messages";
import saveAppSetting from "@/src/functions/backend/db/app-settings/save-app-setting";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { BotSessionMaxMessagesSettingKey } from "@/src/dict/bot-dict";
import { SaveSessionLengthRequestSchema } from "@/src/schemas/bot-schema";
import type { SessionLengthOverview } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: how many messages a session takes before the user's
 * next message starts a new one. Zero puts the code's default back.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<SessionLengthOverview>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) throw new AppError(`Only a super admin can change how long sessions run.`);

        const { max_messages } = parseWithSchema({ schema: SaveSessionLengthRequestSchema, data: body });

        await saveAppSetting({
            key: BotSessionMaxMessagesSettingKey,
            value: max_messages > 0 ? String(max_messages) : null,
        });

        await logEvent({
            title: "Session length changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} set sessions to take ${max_messages || "the default number of"} messages.`,
            metadata: { max_messages },
            ip_address: grabRequestIP(req),
        });

        return { success: true, singleRes: await grabSessionLengthOverview() };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
