import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import insertConnectorAccountSql from "@/src/functions/backend/db/connectors/insert-connector-account-sql";

function scratch() {
    const db = new Database(":memory:");

    db.run(`CREATE TABLE connector_accounts (
        id INTEGER PRIMARY KEY,
        created_at INTEGER,
        updated_at INTEGER,
        connector_id INTEGER,
        user_id INTEGER,
        label TEXT,
        slug TEXT,
        provider_account_id TEXT,
        status TEXT,
        is_default INTEGER,
        connected_at INTEGER,
        last_checked_at INTEGER,
        last_error TEXT
    )`);

    return db;
}

function insert(db: Database, { label, slug }: { label: string; slug: string }) {
    const statement = insertConnectorAccountSql({
        now: 1000,
        connector_id: 1,
        user_id: 1,
        label,
        slug,
        provider_account_id: "ca_one",
        status: "connected",
    });

    db.query(statement.sql).run(...statement.values);
}

describe("insertConnectorAccountSql", () => {
    test("inserts the sign-in once", () => {
        const db = scratch();

        insert(db, { label: "Ben", slug: "ben" });

        const rows = db.query(`SELECT label, slug, status, is_default, last_error FROM connector_accounts`).all();

        expect(rows).toEqual([{ label: "Ben", slug: "ben", status: "connected", is_default: 0, last_error: "" }]);
    });

    test("keeps the row a second sync already wrote for the same account", () => {
        const db = scratch();

        insert(db, { label: "Ben", slug: "ben" });
        insert(db, { label: "Ben again", slug: "ben-2" });

        const rows = db.query(`SELECT label, slug FROM connector_accounts`).all();

        expect(rows).toEqual([{ label: "Ben", slug: "ben" }]);
    });

    test("adds a different account of the same app", () => {
        const db = scratch();

        insert(db, { label: "Ben", slug: "ben" });

        const statement = insertConnectorAccountSql({
            now: 1000,
            connector_id: 1,
            user_id: 1,
            label: "Ben work",
            slug: "ben-work",
            provider_account_id: "ca_two",
            status: "connected",
        });

        db.query(statement.sql).run(...statement.values);

        expect(db.query(`SELECT provider_account_id FROM connector_accounts ORDER BY id`).all()).toEqual([
            { provider_account_id: "ca_one" },
            { provider_account_id: "ca_two" },
        ]);
    });
});