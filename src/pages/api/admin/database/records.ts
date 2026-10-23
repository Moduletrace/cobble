import userAuth from "@/src/functions/backend/auth/user-auth";
import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabTableRecords from "@/src/functions/backend/database/grab-table-records";
import { DatabaseRecordsRequestSchema } from "@/src/schemas/database-schema";
import type { DatabaseRecordsPayload } from "@/src/types";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: one page of one table's records, read-only. Values
 * come back already cut short; a record opened in full is
 * `api/admin/database/record`.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<DatabaseRecordsPayload>> = async ({ req, query }) => {
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
            schema: DatabaseRecordsRequestSchema,
            data: query,
        });
        const records = await grabTableRecords(request);

        return { success: true, singleRes: records };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
