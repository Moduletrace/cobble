import { AppData } from "@/src/data/app-data";

type Params = {
    user_id?: number | string | null;
};

/**
 * Whether this user left the conversation's debug view open on this device
 * (`rememberDebugOpen`). The view belongs to them, not to a bot, so one
 * answer covers every conversation.
 */
export default function readDebugOpen({ user_id }: Params): boolean {
    try {
        const stored = JSON.parse(localStorage.getItem(AppData["DebugViewStorageKey"]) || "{}");

        return Boolean(stored?.[String(user_id ?? "user")]);
    } catch {
        return false;
    }
}