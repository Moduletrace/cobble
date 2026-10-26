import BunSQLite from "@moduletrace/bun-sqlite";
import clearImplicitSessionLinksSql from "./clear-implicit-session-links-sql";

/**
 * Drops session links from v0.2.8 and earlier that no carry-over made,
 * safe to run on every start (`clearImplicitSessionLinksSql`).
 */
export default async function clearImplicitSessionLinks() {
    await BunSQLite.sql(clearImplicitSessionLinksSql());
}
