import { describe, expect, test } from "bun:test";
import connectRef, {
    ConnectRefHrefPrefix,
    connectRefId,
    connectRequestIdFromHref,
} from "./connect-ref";

describe("connectRef", () => {
    test("writes a connect ref", () => {
        expect(connectRef({ id: 12 })).toBe("[connect:12]");
    });

    test("reads the id back", () => {
        expect(connectRefId({ href: connectRef({ id: 12 }) })).toBe(12);
    });

    test("reads nothing from another ref", () => {
        expect(connectRefId({ href: "#plan-12" })).toBe(0);
        expect(connectRefId({ href: "https://example.com" })).toBe(0);
    });
});

describe("connectRequestIdFromHref", () => {
    test("matches a connect href", () => {
        expect(connectRequestIdFromHref({ href: `${ConnectRefHrefPrefix}7` })).toBe(7);
    });

    test("matches nothing else", () => {
        expect(connectRequestIdFromHref({ href: "#question-7" })).toBe(0);
    });

    test("is a card href", () => {
        expect(ConnectRefHrefPrefix).toBe("#connect-");
    });
});