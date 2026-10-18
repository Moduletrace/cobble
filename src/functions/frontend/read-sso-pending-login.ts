import { AppData } from "@/src/data/app-data";
import type { SSOPendingLogin } from "@/src/types";
import EJSON from "@/src/utils/ejson";

export default function readSSOPendingLogin(): SSOPendingLogin | undefined {
    try {
        const stored = sessionStorage.getItem(
            AppData["SSOPendingLoginStorageKey"],
        );

        return stored
            ? (EJSON.parse(stored) as SSOPendingLogin | undefined)
            : undefined;
    } catch {
        return undefined;
    }
}
