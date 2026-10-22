import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";

/**
 * The shape `listBotFiles` uses for a conversation's props. It has to be the
 * whole folder tree: a bot saves into paths like `reports/` and
 * `seo/coderank/`, and a `[file:ID]` chip in a message can only resolve
 * against the files in these props, so a top-level-only list left every
 * nested file ref as unclickable plain text in the chat.
 */
function rows({ db, scopes, recursive }: { db: Database; scopes: { scope: string; owner_id: number }[]; recursive: boolean }) {
    const owner_sql = scopes.map(() => `(scope = ? AND owner_id = ?)`).join(" OR ");
    const values = scopes.flatMap((s) => [s.scope, s.owner_id]);
    const where = [owner_sql];

    if (!recursive) where.push(`(folder = '' OR folder IS NULL)`);

    return db
        .query(`SELECT id FROM bot_files WHERE ${where.join(" AND ")} ORDER BY id`)
        .all(...values)
        .map((row) => (row as { id: number }).id);
}

const db = new Database(":memory:");

db.run(`CREATE TABLE bot_files (id INTEGER PRIMARY KEY, scope TEXT, owner_id INTEGER, folder TEXT, path TEXT)`);
db.run(
    `INSERT INTO bot_files VALUES
        (1, 'bot', 6, '', 'root.md'),
        (2, 'bot', 6, 'reports', 'reports/audit.md'),
        (3, 'bot', 6, 'seo/coderank', 'seo/coderank/crawl.py'),
        (4, 'bot', 5, 'reports', 'reports/other.md'),
        (5, 'workspace', 2, 'shared', 'shared/doc.md')`,
);

const scopes = [{ scope: "bot", owner_id: 6 }];

describe("a conversation's file list", () => {
    test("the top level alone misses every file a bot saved in a folder", () => {
        expect(rows({ db, scopes, recursive: false })).toEqual([1]);
    });

    test("the whole tree has them all, so a nested file ref resolves", () => {
        expect(rows({ db, scopes, recursive: true })).toEqual([1, 2, 3]);
    });

    test("another owner's folder is never in it", () => {
        expect(rows({ db, scopes, recursive: true })).not.toContain(4);
    });
});
