import { describe, expect, test } from "bun:test";
import parseAskDecision from "./parse-ask-decision";

describe("parseAskDecision", () => {
    test("reads an approval", () => {
        expect(
            parseAskDecision({
                text: `{"decision":"approve","reason":"It has the sheet."}`,
            }),
        ).toEqual({ decision: "approve", reason: "It has the sheet." });
    });

    test("reads a redirect to a bot", () => {
        expect(
            parseAskDecision({
                text: '{"decision":"redirect","target_bot_id":12,"reason":"Model Tester runs models."}',
            }),
        ).toEqual({ decision: "redirect", target_bot_id: 12, reason: "Model Tester runs models." });
    });

    test("reads a refusal with its reason", () => {
        expect(
            parseAskDecision({ text: `{"decision":"refuse","reason":"The user didn't ask for this."}` }),
        ).toEqual({ decision: "refuse", reason: "The user didn't ask for this." });
    });

    test("ignores the prose a model writes around the object", () => {
        expect(
            parseAskDecision({ text: `Here it is:\n{"decision":"approve","reason":"Fine."}\nThat's all.` }),
        ).toEqual({ decision: "approve", reason: "Fine." });
    });

    test("is null when there is no object", () => {
        expect(parseAskDecision({ text: "I think you should ask Model Tester." })).toBeNull();
    });

    test("is null for broken JSON", () => {
        expect(parseAskDecision({ text: '{"decision":"approve",' })).toBeNull();
    });

    test("is null for a decision outside the set", () => {
        expect(parseAskDecision({ text: '{"decision":"maybe","reason":"Unsure."}' })).toBeNull();
    });

    test("is null for a decision with no reason", () => {
        expect(parseAskDecision({ text: '{"decision":"approve","reason":"  "}' })).toBeNull();
    });

    test("is null for a target that isn't a bot id", () => {
        expect(
            parseAskDecision({ text: '{"decision":"redirect","target_bot_id":"Model Tester","reason":"It knows."}' }),
        ).toBeNull();
    });
});
