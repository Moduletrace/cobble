import type { AdminCrudAPIParams } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import _ from "lodash";
import get from "./get";
import post from "./post";
import put from "./put";
import del from "./del";

export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { req, query } = params;

    switch (req.method) {
        case "GET":
            return await get(params);
        case "POST":
            return await post(params);
        case "PUT":
            return await put(params);
        case "DELETE":
            return await del(params);

        default:
            return {
                success: false,
            };
    }
}
