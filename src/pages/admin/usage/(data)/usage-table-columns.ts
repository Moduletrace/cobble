/**
 * The column tracks of the models table, shared by its heading and every
 * row, so a figure always sits under its own heading whatever its width.
 * The table never gets narrower than its columns: it scrolls instead.
 */
export const UsageModelColumns =
    "grid grid-cols-[minmax(160px,1fr)_48px_56px_56px_64px_64px_64px] min-w-[620px]";

/**
 * The column tracks of the breakdown by kind of call, the same way.
 */
export const UsageHarnessColumns = "grid grid-cols-[minmax(0,1fr)_40px_72px_64px]";
