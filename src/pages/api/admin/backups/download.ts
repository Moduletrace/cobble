import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import resolveDbBackupPath from "@/src/functions/backend/backups/resolve-db-backup-path";
import type { ApiReqParams } from "@/src/types";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";
import path from "path";

export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
    query,
}) => {
    const user = await grabSuperAdminUser({ req });

    if (!user?.id) {
        return {
            success: false,
            msg: `Unauthorized`,
        };
    }

    try {
        const backup_path = resolveDbBackupPath({
            backup_name: (query as ApiReqParams | undefined)?.backup_name,
        });

        return new Response(Bun.file(backup_path), {
            headers: {
                "Content-Type": "application/vnd.sqlite3",
                "Content-Disposition": `attachment; filename="${path.basename(backup_path)}.sqlite"`,
            },
        });
    } catch (error: any) {
        return {
            success: false,
            msg: error.message,
        };
    }
};
