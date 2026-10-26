import type { BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";

type Params = {
    session: Pick<BUN_SQLITE_COBBLE_BOT_SESSIONS, "id" | "status">;
};

/**
 * Keeps the address on the session the thread shows: `?session_id=` for a
 * closed one, a plain address for the active one (or when the asked one
 * couldn't be shown). Replaces the entry, so the back button isn't
 * filled with it.
 */
export default function syncSessionQuery({ session }: Params) {
    const url = new URL(window.location.href);

    if (session.status == "active" || !session.id) {
        url.searchParams.delete("session_id");
    } else {
        url.searchParams.set("session_id", String(session.id));
    }

    if (url.href != window.location.href) {
        window.history.replaceState(window.history.state, "", url.href);
    }
}
