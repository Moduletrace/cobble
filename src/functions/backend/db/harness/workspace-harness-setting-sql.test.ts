import { Database } from "bun:sqlite";
import { beforeAll, describe, expect, test } from "bun:test";
import workspaceHarnessSettingSql from "./workspace-harness-setting-sql";

const db = new Database(":memory:");

beforeAll(() => {
    db.run(`CREATE TABLE bots (id INTEGER PRIMARY KEY, kind TEXT)`);
    db.run(
        `CREATE TABLE workspace_harness_settings (workspace_id INTEGER, harness TEXT, model_id INTEGER)`,
    );
    db.run(`INSERT INTO bots VALUES (1, 'coordinator'), (2, 'worker')`);
    db.run(`INSERT INTO workspace_harness_settings VALUES (10, 'text', 99)`);
});

function row({ workspace_id, bot_id }: { workspace_id: number; bot_id?: number | null }) {
    const query = workspaceHarnessSettingSql({ workspace_id, harness: "text", bot_id });

    return db.query(query.sql).get(...query.values) as { model_id: number } | null;
}

describe("workspaceHarnessSettingSql", () => {
    test("a worker bot takes the workspace's row", () => {
        expect(row({ workspace_id: 10, bot_id: 2 })?.model_id).toBe(99);
    });

    test("the coordinator never takes the workspace's row (L4)", () => {
        expect(row({ workspace_id: 10, bot_id: 1 })).toBeNull();
    });

    test("with no bot named the row still applies, as before", () => {
        expect(row({ workspace_id: 10 })?.model_id).toBe(99);
        expect(row({ workspace_id: 10, bot_id: null })?.model_id).toBe(99);
    });

    test("a workspace with no row gives nothing", () => {
        expect(row({ workspace_id: 11, bot_id: 2 })).toBeNull();
    });
});