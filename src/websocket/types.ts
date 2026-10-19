import type { User } from "@/src/types";
import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";

export type WebSocketSession = {
    user: User;
    user_types: BUN_SQLITE_COBBLE_USER_TYPES[];
    /**
     * Set on a socket bridged to a computer, never on the app's own `/ws`.
     */
    proxy?: ComputerProxySession;
};
/**
 * A websocket bridged to a computer (`computerProxySocket`): the address
 * on the computer and the headers to open it with. `upstream` and
 * `pending` are filled once it opens.
 */
export type ComputerProxySession = {
    url: string;
    headers: Record<string, string>;
    protocols: string[];
    upstream?: WebSocket;
    pending?: (string | Buffer)[];
};
