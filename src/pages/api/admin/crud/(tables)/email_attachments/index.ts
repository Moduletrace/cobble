import type { AdminCrudAPIParams } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import {
    gatedCrudDelete,
    gatedCrudGet,
    gatedCrudPost,
    gatedCrudPut,
} from "../../(utils)/gated-crud";

export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    switch (params.req.method) {
        case "GET":
            return await gatedCrudGet(params);
        case "POST":
            return await gatedCrudPost(params);
        case "PUT":
            return await gatedCrudPut(params);
        case "DELETE":
            return await gatedCrudDelete(params);

        default:
            return {
                success: false,
                msg: `Unhandled`,
            };
    }
}