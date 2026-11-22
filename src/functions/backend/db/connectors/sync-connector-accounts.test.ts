/**
 * The row an id-less reconnect replaces. The production fault this pins:
 * 0.27.6 fell back to the one dead row with the requested name, so a new
 * mailbox that arrived while a dead row existed took that row's label and
 * namespace. Only a pending request that names a row may hand it over.
 */
import { expect, test } from "bun:test";
import { pendingReconnectRow } from "./sync-connector-accounts";

test("an id-less reconnect names the row its request does", () => {
    expect(pendingReconnectRow([{ account_id: 5, provider_account_id: "" }])).toBe(5);
});

test("a reconnect the provider gave an id for is not an id-less one", () => {
    expect(pendingReconnectRow([{ account_id: 5, provider_account_id: "ca_new" }])).toBeNull();
});

test("a plain sign-in (no row) and no request name nothing", () => {
    expect(pendingReconnectRow([])).toBeNull();
    expect(pendingReconnectRow([{ account_id: 0, provider_account_id: "" }])).toBeNull();
});