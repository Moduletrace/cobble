import BunSQLite from "@moduletrace/bun-sqlite";
import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { LogCategories } from "@/src/dict/log-categories";
import { ClearLogsRequestSchema } from "@/src/schemas/log-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: deletes every log in the Activity page's open tab (a
 * category, or all of them), then logs that it did, so wiping the audit
 * trail still leaves a trace.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<{ deleted: number }>> = async ({
    req,
    body,
}) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) throw new AppError(`Only a super admin can delete logs.`);

        const { category } = parseWithSchema({ schema: ClearLogsRequestSchema, data: body });

        const counted = await BunSQLite.sql<{ count: number }>({
            sql: category
                ? `SELECT COUNT(*) AS count FROM logs WHERE category = ?`
                : `SELECT COUNT(*) AS count FROM logs`,
            values: category ? [category] : [],
        });

        const deleted = Number(counted.payload?.[0]?.count) || 0;

        const res = await BunSQLite.sql({
            sql: category ? `DELETE FROM logs WHERE category = ?` : `DELETE FROM logs`,
            values: category ? [category] : [],
        });

        if (!res.success) throw new Error(`Logs not deleted: ${res.msg || res.error}`);

        const category_title = category
            ? LogCategories.find((lc) => lc.value == category)?.title || category
            : "All";

        await logEvent({
            title: "Logs deleted",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} deleted ${deleted} log${deleted == 1 ? "" : "s"} (${category_title}).`,
            metadata: { category: category || null, deleted },
            ip_address: grabRequestIP(req),
        });

        return { success: true, singleRes: { deleted } };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
