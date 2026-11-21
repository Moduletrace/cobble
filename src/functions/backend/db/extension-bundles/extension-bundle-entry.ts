import type { ExtensionBundleItem } from "@/src/types";

/**
 * An exported item with the row it came from: the bundle itself carries no
 * ids, but the import needs them to say which row a match is.
 */
export type ExtensionBundleEntry = {
    id: number;
    item: ExtensionBundleItem;
};