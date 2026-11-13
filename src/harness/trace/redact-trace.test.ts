import { describe, expect, test } from "bun:test";
import redactSecrets from "@/src/utils/redact-secrets";
import type { HarnessTrace } from "./types";
import redactTrace from "./redact-trace";

const secrets = [{ key: "API_KEY", value: "sk-very-secret" }];
const redact = (text: string) => redactSecrets({ text, secrets });

const turn: HarnessTrace = {
    kind: "turn",
    index: 0,
    model: "m",
    provider: "p",
    text: "Using sk-very-secret now.",
    reasoning: "The key is sk-very-secret.",
    tool_calls: [{ name: "bash", arguments: `{"cmd":"echo sk-very-secret"}` }],
    usage: null,
    finish_reason: "tool_calls",
    duration_ms: 5,
};

describe("redactTrace", () => {
    test("blanks the secret out of a turn's answer, reasoning and tool calls", () => {
        const safe = redactTrace({ trace: turn, redact });

        expect(safe).toEqual({
            ...turn,
            text: "Using [API_KEY] now.",
            reasoning: "The key is [API_KEY].",
            tool_calls: [{ name: "bash", arguments: `{"cmd":"echo [API_KEY]"}` }],
        });
    });

    test("blanks it out of a tool's arguments and answer", () => {
        const safe = redactTrace({
            trace: {
                kind: "tool",
                index: 0,
                name: "computer_bash",
                arguments: "export KEY=sk-very-secret",
                result: "sk-very-secret",
                ok: true,
                images: 0,
                duration_ms: 3,
            },
            redact,
        });

        expect(safe).toMatchObject({
            arguments: "export KEY=[API_KEY]",
            result: "[API_KEY]",
        });
    });

    test("blanks it out of an event's note", () => {
        expect(
            redactTrace({
                trace: { kind: "event", index: 1, name: "incoming", text: "sk-very-secret" },
                redact,
            }),
        ).toMatchObject({ text: "[API_KEY]" });
    });

    test("keeps a turn with no text as it was", () => {
        expect(
            redactTrace({
                trace: { ...turn, text: null, reasoning: null },
                redact,
            }),
        ).toMatchObject({ text: null, reasoning: null });
    });
});