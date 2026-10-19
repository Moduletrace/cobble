import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";
import handleUserGrant from "./(functions)/handle-user-grant";

/**
 * Takes one worker or workspace away from a user (`handleUserGrant`). Returns the user.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BUN_SQLITE_COBBLE_USERS_JOIN>> = async ({ req, body }) =>
    handleUserGrant({ req, body, granted: false });
