import type { User } from "@/src/types";
import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";

export type WebSocketSession = {
    user: User;
    user_types: BUN_SQLITE_COBBLE_USER_TYPES[];
};