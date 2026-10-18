import type { AdminCrudAPIParams } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import _ from "lodash";
import get from "./get";
import post from "./post";
import put from "./put";

export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { req } = params;

    switch (req.method) {
        case "GET":
            return await get(params);
        case "POST":
            return await post(params);
        case "PUT":
            return await put(params);
        case "DELETE":
            return {
                success: false,
                msg: `Can't delete any user`,
            };

        default:
            return {
                success: false,
            };
    }
}
