import { describe, expect, test } from "bun:test";
import connectorAccountReachSql from "./connector-account-reach-sql";

describe("connectorAccountReachSql", () => {
    test("a connector given to a workspace hands every connected account of it to that workspace", () => {
        const { sql, values } = connectorAccountReachSql({ workspace_id: 4 });

        expect(sql).toContain("SELECT 1 FROM workspace_connectors wc");
        expect(sql).toContain("wc.connector_id = a.connector_id");
        expect(sql).toContain("wc.workspace_id = ?");
        expect(values).toEqual([4]);
    });

    test("the global scope brings no accounts, only the workspace grant does", () => {
        expect(connectorAccountReachSql({ workspace_id: 4 }).sql).not.toContain("all_bots");
    });

    test("a run outside a workspace gets no clause", () => {
        expect(connectorAccountReachSql({})).toEqual({ sql: "", values: [] });
        expect(connectorAccountReachSql({ workspace_id: null })).toEqual({ sql: "", values: [] });
        expect(connectorAccountReachSql({ workspace_id: 0 })).toEqual({ sql: "", values: [] });
    });
});