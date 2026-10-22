import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_ENVS } from "@/db/types/db";
import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import deleteEnv from "@/src/functions/backend/db/envs/delete-env";
import grabEnvsOverview from "@/src/functions/backend/db/envs/grab-envs-overview";
import grabScopedEnvs from "@/src/functions/backend/db/envs/grab-scoped-envs";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { EnvIdRequestSchema } from "@/src/schemas/env-schema";
import type { EnvsMutationResult } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admin only: removes an env. Answers with the fresh page data, the
 * Environment overview or, from a bot's or workspace's settings page
 * (`scoped`), just that scope's envs.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<EnvsMutationResult>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) {
            throw new AppError(`Only a super admin can change the environment.`);
        }

        const { env_id, scoped } = parseWithSchema({
            schema: EnvIdRequestSchema,
            data: body,
        });

        const env = (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_ENVS>({
                sql: `SELECT key, paradigm, workspace_id, bot_id FROM envs WHERE id = ? LIMIT 1`,
                values: [env_id],
            })
        ).payload?.[0];

        if (!env) throw new AppError(`That env no longer exists.`);

        await deleteEnv({ env_id });

        await logEvent({
            title: "Env removed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} removed ${env.key} (${env.paradigm}).`,
            metadata: { env_id, key: env.key, paradigm: env.paradigm },
            ip_address: grabRequestIP(req),
        });

        if (scoped && (env.paradigm == "bot" || env.paradigm == "workspace")) {
            const owner_id = env.paradigm == "bot" ? env.bot_id : env.workspace_id;

            if (owner_id) {
                return {
                    success: true,
                    msg: `Removed ${env.key}.`,
                    singleRes: {
                        scoped: await grabScopedEnvs({
                            paradigm: env.paradigm,
                            owner_id,
                            user_id: Number(user.id),
                            can_manage: true,
                        }),
                    },
                };
            }
        }

        return {
            success: true,
            msg: `Removed ${env.key}.`,
            singleRes: { overview: await grabEnvsOverview({ user_id: Number(user.id) }) },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
