import { describe, expect, test } from "bun:test";
import botConnectorsSql from "./bot-connectors-sql";

describe("botConnectorsSql", () => {
    test("a run in a workspace gets global, workspace, its user's bot rows and accounts given here", () => {
        const { sql, values } = botConnectorsSql({ bot_id: 7, user_id: 3, workspace_id: 12 });

        expect(sql).toContain("x.all_bots = 1");
        expect(sql).toContain("SELECT connector_id FROM workspace_connectors WHERE workspace_id = ?");
        expect(sql).toContain("SELECT connector_id FROM bot_connectors WHERE bot_id = ? AND user_id = ?");
        expect(sql).toContain("connector_account_bots ab WHERE ab.account_id = a.id AND ab.bot_id = ?");
        expect(sql).toContain(
            "connector_account_workspaces aw WHERE aw.account_id = a.id AND aw.workspace_id = ?",
        );
        expect(values).toEqual([12, 7, 3, 7, 12]);
    });

    test("a run outside a workspace leaves the workspace clauses out", () => {
        const { sql, values } = botConnectorsSql({ bot_id: 7, user_id: 3 });

        expect(sql).not.toContain("workspace_connectors");
        expect(sql).not.toContain("connector_account_workspaces");
        expect(sql).toContain("bot_connectors WHERE bot_id = ? AND user_id = ?");
        expect(values).toEqual([7, 3, 7]);
    });

    test("the personal clause always names the user, so nobody else's bot row shows", () => {
        expect(botConnectorsSql({ bot_id: 7, user_id: 3 }).sql).toContain("user_id = ?");
    });

    test("an account given to the bot or every bot brings its app along", () => {
        const { sql } = botConnectorsSql({ bot_id: 7, user_id: 3 });

        expect(sql).toContain("a.all_bots = 1");
        expect(sql).toContain("connector_account_bots");
        expect(sql).toContain("a.status = 'connected'");
    });

    test("turned-off connectors never reach a run", () => {
        expect(botConnectorsSql({ bot_id: 7, user_id: 3 }).sql).toContain("x.enabled = 1");
    });
});