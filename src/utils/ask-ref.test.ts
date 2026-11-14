import { describe, expect, test } from "bun:test";
import askRef, { AskRefHrefPrefix, askRefId } from "./ask-ref";

describe("askRef", () => {
    test("writes the ref", () => {
        expect(askRef({ id: 20 })).toBe("[ask:20]");
    });
});

describe("askRefId", () => {
    test("reads the id back", () => {
        expect(askRefId({ href: `${AskRefHrefPrefix}20` })).toBe(20);
    });

    test("null for another link", () => {
        expect(askRefId({ href: "#task-20" })).toBeNull();
        expect(askRefId({ href: null })).toBeNull();
    });
});
