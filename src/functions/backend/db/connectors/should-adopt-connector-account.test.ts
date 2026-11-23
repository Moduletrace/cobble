import { describe, expect, test } from "bun:test";
import shouldAdoptConnectorAccount from "@/src/functions/backend/db/connectors/should-adopt-connector-account";

describe("shouldAdoptConnectorAccount", () => {
    test("adopts a connected account its own sign-in made", () => {
        expect(shouldAdoptConnectorAccount({ status: "connected", reconnect: true, claimed: false })).toBe(true);
        expect(shouldAdoptConnectorAccount({ status: "connected", reconnect: false, claimed: true })).toBe(true);
    });

    test("leaves a connected account nothing here asked for at the provider", () => {
        expect(shouldAdoptConnectorAccount({ status: "connected", reconnect: false, claimed: false })).toBe(false);
    });

    test("leaves an unfinished sign-in alone until it connects", () => {
        expect(shouldAdoptConnectorAccount({ status: "pending", reconnect: true, claimed: false })).toBe(false);
        expect(shouldAdoptConnectorAccount({ status: "pending", reconnect: false, claimed: true })).toBe(false);
        expect(shouldAdoptConnectorAccount({ status: "expired", reconnect: false, claimed: false })).toBe(false);
    });
});