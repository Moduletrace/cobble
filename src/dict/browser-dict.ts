/**
 * Tools a new browser starts without. Playwright MCP's run code on the
 * machine beside the browser and read files from it, both far past driving
 * a page, so their owner has to turn them on knowingly.
 */
export const BrowserDefaultExcludedTools = ["browser_run_code_unsafe", "browser_file_upload"] as const;

/**
 * The picker's value for "the computer's browser".
 */
export const BrowserComputerDefault = "computer";

/**
 * The picker's value for "whatever the wider scope says".
 */
export const BrowserInheritDefault = "inherit";

/**
 * What a run is, for whether it may reach a user's browser: someone is
 * following it, it's one of their routines, or nobody will see it (a hook
 * call, a chatroom).
 */
export const BrowserRunKinds = ["attended", "routine", "unattended"] as const;

export type BrowserRunKind = (typeof BrowserRunKinds)[number];
