import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import type { AdminCrudAPIParams } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";

export default async function ({
    user,
    user_types,
}: AdminCrudAPIParams): Promise<APIResponseObject> {
    if (!user?.id) {
        return {
            success: false,
            msg: `No user passed`,
        };
    }

    const is_super_admin = checkUserAccess({ user_types });

    if (!is_super_admin.success) {
        return {
            success: false,
            msg: `Unauthorized`,
        };
    }

    return {
        success: true,
    };
}
