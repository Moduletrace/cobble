#!/usr/bin/env bun
import BunSQLite from "@moduletrace/bun-sqlite";

function printJson({ value }: { value: unknown }) {
    console.log(
        JSON.stringify(
            value,
            (_key, item) =>
                typeof item === "bigint" ? item.toString() : item,
            2,
        ),
    );
}

async function queryDb({ sql }: { sql: string }) {
    const res = await BunSQLite.sql({ sql });
    const failed = Boolean(res.error) || res.msg === "Database query failed";
    printJson({
        value: {
            success: !failed,
            payload: res.payload,
            count: res.payload?.length ?? res.count,
            insert_return: res.postInsertReturn,
            error: res.error,
            msg: res.msg,
        },
    });
    process.exit(failed ? 1 : 0);
}

const sql = Bun.argv.slice(2).join(" ").trim();
if (!sql) {
    console.error("Usage: bun llm-code-assistant/query-db.ts <sql>");
    process.exit(1);
}
await queryDb({ sql });