import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabRunLimitsOverview, {
    type RunLimitsOverview,
} from "@/src/functions/backend/db/app-settings/grab-run-limits";
import saveAppSetting from "@/src/functions/backend/db/app-settings/save-app-setting";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { BotReplyMaxToolStepsSettingKey } from "@/src/dict/bot-dict";
import { HarnessMaxToolStepsSettingKey } from "@/src/dict/harness-dict";
import { SaveRunLimitsRequestSchema } from "@/src/schemas/harness-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: how many model turns a task run and a chat reply may
 * take. Zero puts the code's default back for that one.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<RunLimitsOverview>> = async ({
    req,
    body,
}) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) throw new AppError(`Only a super admin can change the run limits.`);

        const { task_steps, reply_steps } = parseWithSchema({
            schema: SaveRunLimitsRequestSchema,
            data: body,
        });

        await saveAppSetting({
            key: HarnessMaxToolStepsSettingKey,
            value: task_steps > 0 ? String(task_steps) : null,
        });
        await saveAppSetting({
            key: BotReplyMaxToolStepsSettingKey,
            value: reply_steps > 0 ? String(reply_steps) : null,
        });

        await logEvent({
            title: "Bot run limits changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} set the tool step limits to ${task_steps || "default"} per task and ${reply_steps || "default"} per chat reply.`,
            metadata: { task_steps, reply_steps },
            ip_address: grabRequestIP(req),
        });

        return { success: true, singleRes: await grabRunLimitsOverview() };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
