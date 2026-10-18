import type { AdminCrudAPIParams } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";

export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    return {
        success: false,
        msg: `Can't update computer access. Can only delete and insert.`,
    };
}
