import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import type { StorageScope } from "@/src/utils/storage-access";
import botFilesFilter from "./bot-files-filter";

/**
 * `list_files` with a search looked only at the root, so a bot that had
 * just saved `images/summit-hero-pil.png` was told it had no matching file,
 * believed its own save had never happened, and sent a task hunting the
 * filesystem for it. A search now looks through every folder.
 */
const db = new Database(":memory:");

db.run(`CREATE TABLE bot_files (id INTEGER PRIMARY KEY, scope TEXT, owner_id INTEGER, folder TEXT, name TEXT, path TEXT)`);
db.run(
    `INSERT INTO bot_files VALUES
        (1, 'bot', 20, '', 'root.md', 'root.md'),
        (2, 'bot', 20, 'images', 'summit-hero-pil.png', 'images/summit-hero-pil.png'),
        (3, 'bot', 20, 'scripts', 'render-hero.py', 'scripts/render-hero.py'),
        (4, 'bot', 20, 'reports', 'render.md', 'reports/render.md'),
        (5, 'bot', 21, 'images', 'summit-hero-pil.png', 'images/summit-hero-pil.png'),
        (6, 'workspace', 2, 'shared', 'summit-hero-pil.png', 'shared/summit-hero-pil.png')`,
);

const scopes: StorageScope[] = [{ scope: "bot", owner_id: 20 }];

function ids({ folder, recursive, search }: { folder?: string | null; recursive?: boolean; search?: string | null }) {
    const { where, values } = botFilesFilter({ scopes, folder, recursive, search });

    return db
        .query(`SELECT id FROM bot_files WHERE ${where.join(" AND ")} ORDER BY id`)
        .all(...values)
        .map((row) => (row as { id: number }).id);
}

describe("the file listing filter", () => {
    test("a search with no folder finds a file saved in a subfolder", () => {
        expect(ids({ search: "summit-hero" })).toEqual([2]);
    });

    test("a search across folders finds every match, wherever it is saved", () => {
        expect(ids({ search: "render" })).toEqual([3, 4]);
    });

    test("a named empty folder is still only that folder's own files", () => {
        expect(ids({ folder: "" })).toEqual([1]);
    });

    test("a named folder lists what it holds", () => {
        expect(ids({ folder: "images" })).toEqual([2]);
    });

    test("a named folder searched looks through it, not the rest of the tree", () => {
        expect(ids({ folder: "images", search: "render" })).toEqual([]);
    });

    test("a recursive folder takes everything under it", () => {
        expect(ids({ folder: "reports", recursive: true })).toEqual([4]);
        expect(ids({ folder: "bot", recursive: true })).toEqual([]);
    });

    test("another bot's file with the same name is never in it", () => {
        expect(ids({ search: "summit-hero" })).not.toContain(5);
    });
});