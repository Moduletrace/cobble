import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import {
    grabSystemPromptAppendOverview,
    type SystemPromptAppendOverview,
} from "@/src/functions/backend/db/app-settings/grab-system-prompt-append";
import saveAppSetting from "@/src/functions/backend/db/app-settings/save-app-setting";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { BotSystemPromptAppendSettingKey } from "@/src/dict/bot-dict";
import { SaveSystemPromptAppendRequestSchema } from "@/src/schemas/bot-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: the install-wide text every bot gets right after its
 * own core instructions. An empty text removes it.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<SystemPromptAppendOverview>> = async ({
    req,
    body,
}) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) throw new AppError(`Only a super admin can change the prompt appendix.`);

        const { text } = parseWithSchema({
            schema: SaveSystemPromptAppendRequestSchema,
            data: body,
        });

        await saveAppSetting({
            key: BotSystemPromptAppendSettingKey,
            value: text || null,
        });

        await logEvent({
            title: "Bot prompt appendix changed",
            category: "system",
            user_id: user.id,
            plain_text: text
                ? `User #${user.id} set the install-wide bot prompt appendix (${text.length} characters).`
                : `User #${user.id} removed the install-wide bot prompt appendix.`,
            metadata: { characters: text.length },
            ip_address: grabRequestIP(req),
        });

        return { success: true, singleRes: await grabSystemPromptAppendOverview() };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
