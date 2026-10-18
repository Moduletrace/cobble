import grabUserAuthTypes from "@/src/functions/backend/auth/grab-user-auth-types";
import type { BUN_SQLITE_BSQLITE_USER_TYPES } from "@/db/types/db";
import type { WebSocketSession } from "../types";

type Params = {
    session: WebSocketSession;
};

type Return = {
    allowed: boolean;
    user_types?: BUN_SQLITE_BSQLITE_USER_TYPES[];
};

/**
 * # Check WebSocket Session Access
 * The session is frozen into the socket at upgrade time, so access is
 * re-checked while the socket is alive. This makes revocation immediate
 * instead of waiting for the client to disconnect.
 */
export default async function checkSessionAccess({
    session,
}: Params): Promise<Return> {
    if (!session.user?.id) {
        return { allowed: false };
    }

    const res = await grabUserAuthTypes({ user_id: session.user.id });

    return {
        allowed: res.success && Boolean(res.user_types?.[0]),
        user_types: res.user_types ?? undefined,
    };
}
