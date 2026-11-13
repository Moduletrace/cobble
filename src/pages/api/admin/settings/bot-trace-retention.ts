import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabBotTraceRetentionOverview from "@/src/functions/backend/db/app-settings/grab-bot-trace-keep-days";
import saveAppSetting from "@/src/functions/backend/db/app-settings/save-app-setting";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { BotTraceKeepDaysSettingKey } from "@/src/dict/bot-trace-dict";
import { SaveBotTraceRetentionRequestSchema } from "@/src/schemas/bot-trace-schema";
import type { BotTraceRetentionOverview } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: how many days a run's detailed trace (the
 * conversation's debug view) is kept before the daily prune deletes it.
 * Zero puts the code's default back.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BotTraceRetentionOverview>> = async ({
    req,
    body,
}) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) throw new AppError(`Only a super admin can change how long run traces are kept.`);

        const { keep_days } = parseWithSchema({ schema: SaveBotTraceRetentionRequestSchema, data: body });

        await saveAppSetting({
            key: BotTraceKeepDaysSettingKey,
            value: keep_days > 0 ? String(keep_days) : null,
        });

        await logEvent({
            title: "Run trace retention changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} set run traces to be kept for ${keep_days || "the default number of"} days.`,
            metadata: { keep_days },
            ip_address: grabRequestIP(req),
        });

        return { success: true, singleRes: await grabBotTraceRetentionOverview() };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};