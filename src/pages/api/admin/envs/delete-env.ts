import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_ENVS } from "@/db/types/db";
import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import deleteEnv from "@/src/functions/backend/db/envs/delete-env";
import grabEnvsOverview from "@/src/functions/backend/db/envs/grab-envs-overview";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { EnvIdRequestSchema } from "@/src/schemas/env-schema";
import type { EnvsOverviewPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admin only: removes an env.
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

        const { env_id } = parseWithSchema({ schema: EnvIdRequestSchema, data: body });

        const env = (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_ENVS>({
                sql: `SELECT key, paradigm FROM envs WHERE id = ? LIMIT 1`,
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
            metadata: { env_id, key: env.key },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Removed ${env.key}.`,
            singleRes: await grabEnvsOverview({ user_id: Number(user.id) }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
