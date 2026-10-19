import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabEnvsOverview from "@/src/functions/backend/db/envs/grab-envs-overview";
import saveEnv from "@/src/functions/backend/db/envs/save-env";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SaveEnvRequestSchema } from "@/src/schemas/env-schema";
import type { EnvsOverviewPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admin only: adds or edits an env. Logged by key, never by value.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<EnvsOverviewPayload>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) {
            throw new AppError(`Only a super admin can change the environment.`);
        }

        const env = parseWithSchema({ schema: SaveEnvRequestSchema, data: body });

        await saveEnv({ ...env, user_id: Number(user.id) });

        await logEvent({
            title: env.env_id ? "Env changed" : "Env added",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} ${env.env_id ? "changed" : "added"} ${env.key} (${env.paradigm}${env.workspace_id ? ` #${env.workspace_id}` : env.computer_id ? ` #${env.computer_id}` : ""}).`,
            metadata: { key: env.key, paradigm: env.paradigm, workspace_id: env.workspace_id, computer_id: env.computer_id },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Saved ${env.key.trim()}.`,
            singleRes: await grabEnvsOverview({ user_id: Number(user.id) }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
