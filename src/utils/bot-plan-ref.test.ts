import { describe, expect, test } from "bun:test";
import botPlanRef, { botPlanRefId, BotPlanRefHrefPrefix } from "./bot-plan-ref";
import linkComputerRefs from "./link-computer-refs";

/**
 * A plan reaches the chat as `[plan:4]`, which the renderer turns into a
 * link its card reads the id back from. A ref the bot wrote inside a code
 * span alone still links; one inside longer code stays as it was written.
 */
describe("botPlanRef", () => {
    test("writes the ref the message carries", () => {
        expect(botPlanRef({ plan_id: 4 })).toBe("[plan:4]");
        expect(botPlanRef({ plan_id: "4" })).toBe("[plan:4]");
    });

    test("reads the id back from the card's href, and nothing from another link", () => {
        expect(botPlanRefId({ href: `${BotPlanRefHrefPrefix}12` })).toBe(12);
        expect(botPlanRefId({ href: `${BotPlanRefHrefPrefix}0` })).toBeNull();
        expect(botPlanRefId({ href: `${BotPlanRefHrefPrefix}twelve` })).toBeNull();
        expect(botPlanRefId({ href: "#suggestion-4" })).toBeNull();
        expect(botPlanRefId({ href: undefined })).toBeNull();
    });
});

describe("a plan ref in a message", () => {
    test("turns a plan ref into a link", () => {
        expect(linkComputerRefs({ text: "Here it is, [plan:4]: approve when ready." })).toContain(
            "[plan 4](#plan-4)",
        );
    });

    test("links a ref quoted alone in a code span", () => {
        expect(linkComputerRefs({ text: "Written: `[plan:4]`." })).toContain("[plan 4](#plan-4)");
    });

    test("leaves a ref inside longer code as the bot wrote it", () => {
        const text = "```\n[plan:4]\n```";

        expect(linkComputerRefs({ text })).toBe(text);
    });

    test("leaves a ref that is already a link alone", () => {
        const text = "[plan 4](#plan-4)";

        expect(linkComputerRefs({ text })).toBe(text);
    });
});