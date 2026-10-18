import { AppData } from "@/src/data/app-data";
import type { SSOPendingLogin } from "@/src/types";
import EJSON from "@/src/utils/ejson";

/**
 * Remembers which login is waiting for a code, so the SSO page can word
 * itself to match. Best effort only.
 */
export default function saveSSOPendingLogin(pending: SSOPendingLogin) {
    try {
        sessionStorage.setItem(
            AppData["SSOPendingLoginStorageKey"],
            EJSON.stringify(pending) || "",
        );
    } catch {}
}
