import { describe, expect, test } from "bun:test";
import shouldAdoptConnectorAccount from "@/src/functions/backend/db/connectors/should-adopt-connector-account";

describe("shouldAdoptConnectorAccount", () => {
    test("adopts a connected account into the app's free card", () => {
        expect(shouldAdoptConnectorAccount({ status: "connected", reconnect: false, claimed: false, free_slot: true })).toBe(
            true,
        );
    });

    test("leaves a second connected account at the provider once the card is taken", () => {
        expect(shouldAdoptConnectorAccount({ status: "connected", reconnect: false, claimed: false, free_slot: false })).toBe(
            false,
        );
    });

    test("adopts a connected account a request here started, even with no free card", () => {
        expect(shouldAdoptConnectorAccount({ status: "connected", reconnect: false, claimed: true, free_slot: false })).toBe(
            true,
        );
    });

    test("adopts a pending account a request here started", () => {
        expect(shouldAdoptConnectorAccount({ status: "pending", reconnect: false, claimed: true, free_slot: false })).toBe(
            true,
        );
    });

    test("adopts a pending account that reconnects a row", () => {
        expect(shouldAdoptConnectorAccount({ status: "pending", reconnect: true, claimed: false, free_slot: false })).toBe(
            true,
        );
    });

    test("skips a pending account nothing here started", () => {
        expect(shouldAdoptConnectorAccount({ status: "pending", reconnect: false, claimed: false, free_slot: true })).toBe(
            false,
        );
        expect(shouldAdoptConnectorAccount({ status: "expired", reconnect: false, claimed: false, free_slot: true })).toBe(
            false,
        );
    });
});