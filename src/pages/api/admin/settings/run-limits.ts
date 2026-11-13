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
import { UnlimitedLimit } from "@/src/utils/run-limit";
import HarnessCooldowns from "@/src/harness/resolve/harness-cooldowns";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * What a sent field is saved as: the sentinel when it asks for no limit,
 * nothing (the code's default) for zero, its number otherwise.
 */
const savedValue = (value: number) => (value == -1 ? UnlimitedLimit : value > 0 ? String(value) : null);

/**
 * How a sent field reads in the activity log: "unlimited", "default" or
 * its number.
 */
const loggedValue = (value: number) => (value == -1 ? "unlimited" : value > 0 ? String(value) : "default");

/**
 * Super admin only: how many model turns a task run, a chat reply and a
 * routine run or hook call may take, the prompt tokens one run may spend,
 * the working context it keeps and how long a failed model rests. -1 means
 * no limit, 0 puts the code's default back for that one.
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

        await saveAppSetting({ key: HarnessMaxToolStepsSettingKey, value: savedValue(task_steps) });
        await saveAppSetting({ key: BotReplyMaxToolStepsSettingKey, value: savedValue(reply_steps) });
        await saveAppSetting({ key: UnattendedMaxToolStepsSettingKey, value: savedValue(unattended_steps) });
        await saveAppSetting({ key: RunMaxPromptTokensSettingKey, value: savedValue(run_tokens) });
        await saveAppSetting({ key: HarnessContextBudgetSettingKey, value: savedValue(context_tokens) });
        await saveAppSetting({ key: HarnessModelRestSettingKey, value: savedValue(model_rest_seconds) });

        /**
         * A rest with no end lasts until this setting changes, so what was
         * benched may be tried again now. Clearing a timed one too costs
         * at most one failed call each.
         */
        HarnessCooldowns.clear();

        await logEvent({
            title: "Bot run limits changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} set the tool step limits to ${loggedValue(task_steps)} per task, ${loggedValue(reply_steps)} per chat reply and ${loggedValue(unattended_steps)} per routine or hook call, the tokens per run to ${loggedValue(run_tokens)}, the working context to ${loggedValue(context_tokens)} and the model rest to ${
                model_rest_seconds == -1 ? "unlimited" : model_rest_seconds > 0 ? `${model_rest_seconds} seconds` : "default"
            }.`,
            metadata: { task_steps, reply_steps, unattended_steps, run_tokens, context_tokens, model_rest_seconds },
            ip_address: grabRequestIP(req),
        });

        return { success: true, singleRes: await grabRunLimitsOverview() };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
