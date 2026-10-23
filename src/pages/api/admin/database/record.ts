import userAuth from "@/src/functions/backend/auth/user-auth";
import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabTableRecord from "@/src/functions/backend/database/grab-table-record";
import { DatabaseRecordRequestSchema } from "@/src/schemas/database-schema";
import type { DatabaseRecordPayload } from "@/src/types";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: one record of one table, in full for its modal,
 * read-only.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<DatabaseRecordPayload>> = async ({ req, query }) => {
    try {
        if (req.method != "GET") {
            return { success: false, msg: `Method not allowed` };
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (!(await grabSuperAdminUser({ req }))) {
            return { success: false, msg: `Only a super admin can read the database.` };
        }

        const request = parseWithSchema({
            schema: DatabaseRecordRequestSchema,
            data: query,
        });

        return { success: true, singleRes: await grabTableRecord(request) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
