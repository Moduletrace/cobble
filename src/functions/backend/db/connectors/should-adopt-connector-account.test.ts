import { describe, expect, test } from "bun:test";
import shouldAdoptConnectorAccount from "@/src/functions/backend/db/connectors/should-adopt-connector-account";

describe("shouldAdoptConnectorAccount", () => {
    test("adopts a connected account whether or not a request claims it", () => {
        expect(shouldAdoptConnectorAccount({ status: "connected", reconnect: false, claimed: false })).toBe(true);
        expect(shouldAdoptConnectorAccount({ status: "connected", reconnect: false, claimed: true })).toBe(true);
    });

    test("adopts a pending account a request here started", () => {
        expect(shouldAdoptConnectorAccount({ status: "pending", reconnect: false, claimed: true })).toBe(true);
    });

    test("adopts a pending account that reconnects a row", () => {
        expect(shouldAdoptConnectorAccount({ status: "pending", reconnect: true, claimed: false })).toBe(true);
    });

    test("skips a pending account nothing here started", () => {
        expect(shouldAdoptConnectorAccount({ status: "pending", reconnect: false, claimed: false })).toBe(false);
        expect(shouldAdoptConnectorAccount({ status: "expired", reconnect: false, claimed: false })).toBe(false);
    });
});