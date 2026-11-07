import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabRunLimitsOverview, {
    type RunLimitsOverview,
} from "@/src/functions/backend/db/app-settings/grab-run-limits";
import saveAppSetting from "@/src/functions/backend/db/app-settings/save-app-setting";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { BotReplyMaxToolStepsSettingKey } from "@/src/dict/bot-dict";
import {
    HarnessContextBudgetSettingKey,
    HarnessMaxToolStepsSettingKey,
    HarnessModelRestSettingKey,
    RunMaxPromptTokensSettingKey,
    UnattendedMaxToolStepsSettingKey,
} from "@/src/dict/harness-dict";
import { SaveRunLimitsRequestSchema } from "@/src/schemas/harness-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: how many model turns a task run, a chat reply and a
 * routine run or hook call may take, the prompt tokens one run may spend
 * the working context it keeps and how long a failed model rests. Zero puts the code's default back for
 * that one.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<RunLimitsOverview>> = async ({
    req,
    body,
}) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) throw new AppError(`Only a super admin can change the run limits.`);

        const { task_steps, reply_steps, unattended_steps, run_tokens, context_tokens, model_rest_seconds } = parseWithSchema({
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
        await saveAppSetting({
            key: UnattendedMaxToolStepsSettingKey,
            value: unattended_steps > 0 ? String(unattended_steps) : null,
        });
        await saveAppSetting({
            key: RunMaxPromptTokensSettingKey,
            value: run_tokens > 0 ? String(run_tokens) : null,
        });
        await saveAppSetting({
            key: HarnessContextBudgetSettingKey,
            value: context_tokens > 0 ? String(context_tokens) : null,
        });

        await saveAppSetting({
            key: HarnessModelRestSettingKey,
            value: model_rest_seconds > 0 ? String(model_rest_seconds) : null,
        });

        await logEvent({
            title: "Bot run limits changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} set the tool step limits to ${task_steps || "default"} per task, ${reply_steps || "default"} per chat reply and ${unattended_steps || "default"} per routine or hook call, the tokens per run to ${run_tokens || "default"}, the working context to ${context_tokens || "default"} and the model rest to ${model_rest_seconds ? `${model_rest_seconds} seconds` : "default"}.`,
            metadata: { task_steps, reply_steps, unattended_steps, run_tokens, context_tokens, model_rest_seconds },
            ip_address: grabRequestIP(req),
        });

        return { success: true, singleRes: await grabRunLimitsOverview() };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
