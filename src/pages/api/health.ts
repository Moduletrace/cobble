import { AppData } from "@/src/data/app-data";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

export const handler: BunextAPIRouteHandler<APIResponseObject> = async () => {
    return {
        success: true,
        msg: AppData["ServerHealthMessage"],
    };
};