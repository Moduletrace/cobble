import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";

/**
 * Where a connector in a conversation comes from. The production fault this
 * pins: an app given to one workspace (Cloudflare, on workspaces 4 and 5)
 * was read as "From this workspace" in every conversation of the bot it was
 * attached to, because the workspace lookup asked for every workspace's
 * grants and not the conversation's own. The Add list then offered apps that
 * already reached the bot here, and adding one attached it to the bot itself,
 * carrying it into every other workspace.
 *
 * The database is mocked; the SQL each read is given is what is asserted.
 */
const BotId = 1;
const UserId = 1;
const WorkspaceId = 5;

let calls: Array<{ sql: string; values: unknown[] }> = [];
let connector_rows: Array<Record<string, unknown>> = [];
let account_rows: Array<Record<string, unknown>> = [];
let workspace_rows: number[] = [];
let bot_rows: number[] = [];

const fakeSql = async ({ sql, values }: { sql: string; values?: unknown[] }) => {
    calls.push({ sql, values: values || [] });

    if (sql.includes("cc.name AS connection_name") && sql.includes("FROM (")) {
        return { success: true, payload: connector_rows };
    }
    if (sql.includes("AS owner_name")) return { success: true, payload: account_rows };
    if (sql.includes("FROM workspace_connectors WHERE connector_id IN")) {
        // The real table answers for the workspace it was asked about; a read
        // that names no workspace gets every workspace's grants back.
        const workspace = sql.includes("workspace_id = ?") ? Number((values || []).at(-1)) : null;
        const ids = workspace === null ? workspace_rows : workspace_rows.filter(() => workspace === WorkspaceId);
        return { success: true, payload: ids.map((id) => ({ connector_id: id })) };
    }
    if (sql.includes("FROM bot_connectors WHERE connector_id IN")) {
        return { success: true, payload: bot_rows.map((id) => ({ connector_id: id })) };
    }
    return { success: true, payload: [] };
};

mock.module("@moduletrace/bun-sqlite", () => ({ default: { sql: fakeSql } }));

const { default: grabBotConnectors } = await import("./grab-bot-connectors");
const { default: grabAttachableConnectors } = await import("./grab-attachable-connectors");

afterAll(() => {
    mock.restore();
});

beforeEach(() => {
    calls = [];
    connector_rows = [
        {
            id: 206,
            provider: "composio",
            connection_id: 3,
            app: "cloudflare",
            name: "Cloudflare",
            slug: "cloudflare",
            all_bots: 0,
            enabled: 1,
            status: "tested",
            user_id: UserId,
            connection_name: "Composio Personal",
        },
    ];
    account_rows = [{ id: 22, connector_id: 206, user_id: UserId, label: "My account", status: "connected", all_bots: 0 }];
    workspace_rows = [206];
    bot_rows = [206];
});

const queryFor = (needle: string) => calls.find((call) => call.sql.includes(needle));

const grabEntry = async (workspace_id: number | null) => {
    const [entry] = await grabBotConnectors({ user_id: UserId, bot_id: BotId, workspace_id });
    if (!entry) throw new Error("expected the connector");
    return entry;
};

describe("grabBotConnectors", () => {
    test("an app attached to the bot is its own outside a workspace, whatever other workspaces it was given to", async () => {
        const entry = await grabEntry(null);

        expect(entry.via).toBe("bot");
        expect(entry.removable).toBe(true);
        expect(queryFor("FROM workspace_connectors WHERE connector_id IN")).toBeUndefined();
    });

    test("inside the workspace it was given to, it says so", async () => {
        const entry = await grabEntry(WorkspaceId);

        expect(entry.via).toBe("workspace");
        expect(entry.removable).toBe(false);
        expect(queryFor("FROM workspace_connectors WHERE connector_id IN")?.values).toContain(WorkspaceId);
    });

    test("a workspace's grant in another workspace does not reach here", async () => {
        workspace_rows = [];
        const entry = await grabEntry(6);

        expect(entry.via).toBe("bot");
        expect(entry.removable).toBe(true);
    });
});

describe("grabAttachableConnectors", () => {
    test("leaves out every app that already reaches the bot here", async () => {
        await grabAttachableConnectors({ user_id: UserId, bot_id: BotId });
        const read = queryFor("FROM connectors c");

        expect(read?.sql).toContain("c.id NOT IN");
        expect(read?.sql).not.toContain("workspace_connectors");
        expect(read?.values).toContain(BotId);
        expect(read?.values).toContain(UserId);
    });

    test("inside a workspace, the install's and this workspace's own reach is left out too", async () => {
        await grabAttachableConnectors({ user_id: UserId, bot_id: BotId, workspace_id: WorkspaceId });
        const read = queryFor("FROM connectors c");

        expect(read?.sql).toContain("workspace_connectors WHERE workspace_id = ?");
        expect(read?.values).toContain(WorkspaceId);
    });
});