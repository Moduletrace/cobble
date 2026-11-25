import { PwaBuildMetaName } from "@/src/data/pwa-data";

/**
 * The build this document's code came from, read once as the bundle loads
 * (the root renders it as a meta tag). Frozen for the life of the page: it
 * always names the code actually running, never a newer build a later
 * client-side navigation may learn about. Null in development, where
 * nothing is precached and every load is the current code.
 */
const loaded_build =
    typeof document == "undefined"
        ? null
        : document
              .querySelector(`meta[name="${PwaBuildMetaName}"]`)
              ?.getAttribute("content") || null;

export default function loadedBuildId(): string | null {
    return loaded_build;
}