import { BrowserComputerDefault, BrowserInheritDefault } from "@/src/dict/browser-dict";

type Params = {
    /**
     * A browser's id, `computer` or `inherit`.
     */
    default_browser: number | typeof BrowserComputerDefault | typeof BrowserInheritDefault;
    /**
     * The browsers available in the scope. The default always is.
     */
    available_ids: number[];
};

/**
 * What one scope's `browser_access` rows should be, for a user's picks:
 * one row per browser available, and at most one default. The computer's
 * browser only needs a row to win over a wider scope's default.
 */
export default function browserAccessRows({ default_browser, available_ids }: Params) {
    const ids = [...new Set(typeof default_browser == "number" ? [...available_ids, default_browser] : available_ids)];
    const rows: { browser_id: number | null; is_default: 0 | 1 }[] = ids.map((browser_id) => ({
        browser_id,
        is_default: browser_id === default_browser ? 1 : 0,
    }));

    return default_browser == BrowserComputerDefault ? [...rows, { browser_id: null, is_default: 1 as const }] : rows;
}
