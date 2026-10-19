import { describe, expect, test } from "bun:test";
import pickFreeHue from "./pick-free-hue";

describe("pickFreeHue", () => {
    test("takes the first hue nobody has", () => {
        expect(pickFreeHue({ taken: [] })).toBe("ember");
        expect(pickFreeHue({ taken: ["ember", null, "amber"] })).toBe("moss");
    });

    test("falls back to the least used hue", () => {
        const all = ["ember", "amber", "moss", "teal", "cobalt", "violet", "rose"];
        expect(pickFreeHue({ taken: [...all, ...all.filter((h) => h != "teal")] })).toBe("teal");
    });
});
