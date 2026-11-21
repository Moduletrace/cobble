import type { StorageScope } from "@/src/utils/storage-access";

type Params = {
    scopes: StorageScope[];
    folder?: string | null;
    recursive?: boolean;
    search?: string | null;
};

/**
 * The WHERE clause listing a run's files: its directories, one folder (or
 * its whole tree), and a name or path match. A search with no folder looks
 * through every folder, which is what a bot means by "list_files search":
 * scoping it to the root hid `images/summit-hero-pil.png` from the bot that
 * had just written it, and the bot went on to say the file was never saved.
 */
export default function botFilesFilter({ scopes, folder, recursive, search }: Params) {
    const owner_sql = scopes.map(() => `(scope = ? AND owner_id = ?)`).join(" OR ");
    const where = [owner_sql];
    const values: (string | number)[] = scopes.flatMap((s) => [s.scope, s.owner_id]);

    const target = (folder || "").trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");

    if (target) {
        where.push(recursive ? `(folder = ? OR folder LIKE ?)` : `folder = ?`);
        values.push(target);

        if (recursive) values.push(`${target}/%`);
    } else if (typeof folder == "string" && !recursive) {
        /**
         * A folder was named (even as ""), so this is that folder's own
         * listing. No folder at all means every folder, not just the root.
         */
        where.push(`(folder = '' OR folder IS NULL)`);
    }

    if (search?.trim()) {
        where.push(`(name LIKE ? OR path LIKE ?)`);
        values.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    return { where, values };
}