import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabMessageLengthOverview from "@/src/functions/backend/db/app-settings/grab-bot-message-max-chars";
import saveAppSetting from "@/src/functions/backend/db/app-settings/save-app-setting";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { BotMessageMaxCharsSettingKey } from "@/src/dict/bot-dict";
import { SaveMessageLengthRequestSchema } from "@/src/schemas/bot-schema";
import type { MessageLengthOverview } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: the longest chat message a user may send, in
 * characters. Zero puts the code's default back.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<MessageLengthOverview>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) throw new AppError(`Only a super admin can change how long messages may be.`);

        const { max_chars } = parseWithSchema({ schema: SaveMessageLengthRequestSchema, data: body });

        await saveAppSetting({
            key: BotMessageMaxCharsSettingKey,
            value: max_chars > 0 ? String(max_chars) : null,
        });

        await logEvent({
            title: "Message length changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} set messages to take up to ${max_chars || "the default number of"} characters.`,
            metadata: { max_chars },
            ip_address: grabRequestIP(req),
        });

        return { success: true, singleRes: await grabMessageLengthOverview() };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
