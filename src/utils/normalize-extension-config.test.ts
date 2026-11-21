import { describe, expect, test } from "bun:test";
import normalizeExtensionConfig from "./normalize-extension-config";

const argumentsText = `{"type":"object","properties":{"topic":{"type":"string"}}}`;

describe("normalizeExtensionConfig", () => {
    test("reads a tool's arguments from the JSON text of the object", () => {
        const config = normalizeExtensionConfig({ kind: "tool", config: { name: "search", parameters: argumentsText } });

        expect(config.parameters).toEqual({ type: "object", properties: { topic: { type: "string" } } });
    });

    test("leaves arguments that are already an object alone", () => {
        const parameters = { type: "object", properties: {} };

        expect(normalizeExtensionConfig({ kind: "tool", config: { parameters } }).parameters).toBe(parameters);
    });

    test("leaves text that isn't a JSON object alone, so the schema says what's wrong", () => {
        expect(normalizeExtensionConfig({ kind: "tool", config: { parameters: "not json" } }).parameters).toBe("not json");
        expect(normalizeExtensionConfig({ kind: "tool", config: { parameters: "[1,2]" } }).parameters).toBe("[1,2]");
    });

    test("never touches another kind", () => {
        const config = { name: "Cold Email", body: "text" };

        expect(normalizeExtensionConfig({ kind: "skill", config })).toBe(config);
    });
});