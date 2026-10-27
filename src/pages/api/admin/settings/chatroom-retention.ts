import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabChatroomRetentionOverview from "@/src/functions/backend/db/app-settings/grab-chatroom-retention";
import saveAppSetting from "@/src/functions/backend/db/app-settings/save-app-setting";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { ChatroomKeepDaysSettingKey, ChatroomMaxPerPlaceSettingKey } from "@/src/dict/chatroom-dict";
import { SaveChatroomRetentionRequestSchema } from "@/src/schemas/bot-schema";
import type { ChatroomRetentionOverview } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: how many days closed chatrooms are kept and how many
 * rooms one place keeps. Zero puts the code's default back.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<ChatroomRetentionOverview>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) throw new AppError(`Only a super admin can change how long chatrooms are kept.`);

        const { keep_days, max_per_place } = parseWithSchema({ schema: SaveChatroomRetentionRequestSchema, data: body });

        await saveAppSetting({ key: ChatroomKeepDaysSettingKey, value: keep_days > 0 ? String(keep_days) : null });
        await saveAppSetting({
            key: ChatroomMaxPerPlaceSettingKey,
            value: max_per_place > 0 ? String(max_per_place) : null,
        });

        await logEvent({
            title: "Chatroom retention changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} set closed chatrooms to be kept for ${keep_days || "the default number of"} days, ${max_per_place || "the default number of"} rooms per place.`,
            metadata: { keep_days, max_per_place },
            ip_address: grabRequestIP(req),
        });

        return { success: true, singleRes: await grabChatroomRetentionOverview() };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
