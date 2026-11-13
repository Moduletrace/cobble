import { AppData } from "@/src/data/app-data";

type Params = {
    user_id?: number | string | null;
    open: boolean;
};

type States = Record<string, boolean>;

/**
 * The answers stored so far. A value written by an older version (or
 * anything else in its place) reads as none, so the next save replaces it
 * rather than failing.
 */
function readStates(key: string): States {
    try {
        const stored = JSON.parse(localStorage.getItem(key) || "{}");

        return stored && typeof stored == "object" && !Array.isArray(stored) ? stored : {};
    } catch {
        return {};
    }
}

/**
 * Records whether this user keeps the conversation's debug view open on
 * this device, so the next conversation and the next visit start where
 * they left off (`readDebugOpen`). Best effort.
 */
export default function rememberDebugOpen({ user_id, open }: Params) {
    try {
        const key = AppData["DebugViewStorageKey"];
        const states = readStates(key);
        const id = String(user_id ?? "user");

        if (Boolean(states[id]) == open) return;

        states[id] = open;
        localStorage.setItem(key, JSON.stringify(states));
    } catch {}
}