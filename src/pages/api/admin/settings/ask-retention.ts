import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabAskRetention from "@/src/functions/backend/db/app-settings/grab-ask-retention";
import saveAppSetting from "@/src/functions/backend/db/app-settings/save-app-setting";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { AskKeepDaysSettingKey, AskMaxPerPlaceSettingKey } from "@/src/dict/ask-dict";
import { SaveAskRetentionRequestSchema } from "@/src/schemas/bot-schema";
import type { AskRetentionOverview } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: how long ended crew requests are kept and how many one
 * place keeps. Zero puts the code's defaults back.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<AskRetentionOverview>> = async ({
    req,
    body,
}) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) throw new AppError(`Only a super admin can change how long crew requests are kept.`);

        const { keep_days, max_per_place } = parseWithSchema({
            schema: SaveAskRetentionRequestSchema,
            data: body,
        });

        await saveAppSetting({
            key: AskKeepDaysSettingKey,
            value: keep_days > 0 ? String(keep_days) : null,
        });
        await saveAppSetting({
            key: AskMaxPerPlaceSettingKey,
            value: max_per_place > 0 ? String(max_per_place) : null,
        });

        await logEvent({
            title: "Crew request retention changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} set crew requests to be kept for ${keep_days || "the default number of"} days, ${max_per_place || "the default number"} per place.`,
            metadata: { keep_days, max_per_place },
            ip_address: grabRequestIP(req),
        });

        return { success: true, singleRes: await grabAskRetention() };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
