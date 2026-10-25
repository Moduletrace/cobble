import { describe, expect, test } from "bun:test";
import costLabel from "./cost-label";
import providerLabel from "./provider-label";

describe("providerLabel", () => {
    test("adds the kind only when it says more than the name", () => {
        expect(providerLabel({ name: "OpenRouter", kind: "openrouter" })).toBe("OpenRouter");
        expect(providerLabel({ name: "Work key", kind: "openai" })).toBe("Work key · OpenAI");
        expect(providerLabel({ name: "Old one", kind: null })).toBe("Old one");
        expect(providerLabel({ name: null, kind: null })).toBe("Unknown provider");
    });
});

describe("costLabel", () => {
    test("keeps small prices readable", () => {
        expect(costLabel({ cost: 0.000123 })).toBe("$0.000123");
        expect(costLabel({ cost: 0.25 })).toBe("$0.2500");
        expect(costLabel({ cost: 0 })).toBe("Not reported");
        expect(costLabel({ cost: null })).toBe("Not reported");
    });
});
