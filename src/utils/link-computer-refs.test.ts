import { describe, expect, test } from "bun:test";
import botRef from "./bot-ref";
import workspaceRef from "./workspace-ref";
import computerRef from "./computer-ref";
import linkComputerRefs from "./link-computer-refs";
import takeOverRef from "./take-over-ref";

describe("linkComputerRefs", () => {
    test("links every computer a message names", () => {
        expect(
            linkComputerRefs({
                text: `Your GitHub session is on ${computerRef({ id: 3 })}, not ${computerRef({ id: 12 })}.`,
            }),
        ).toBe("Your GitHub session is on [computer 3](#computer-3), not [computer 12](#computer-12).");
    });

    test("leaves look-alikes and existing links alone", () => {
        const text = "See [computer:x], [link](url) and [computer:4](https://example.com)";

        expect(linkComputerRefs({ text })).toBe(text);
    });

    test("links take-over requests", () => {
        expect(
            linkComputerRefs({
                text: `Please log in to Gmail. ${takeOverRef({ id: 3, mode: "browser" })}`,
            }),
        ).toBe("Please log in to Gmail. [take over](#take-over-3-browser)");
    });

    test("links every bot a message names", () => {
        expect(
            linkComputerRefs({
                text: `${botRef({ id: 4 })} is on it. See [bot:x] and [bot:5](https://example.com).`,
            }),
        ).toBe("[bot 4](#bot-4) is on it. See [bot:x] and [bot:5](https://example.com).");
    });

    test("links every workspace a message names", () => {
        expect(
            linkComputerRefs({
                text: `Added to ${workspaceRef({ id: 2 })}. Not [workspace:x] or [workspace:3](https://example.com).`,
            }),
        ).toBe("Added to [workspace 2](#workspace-2). Not [workspace:x] or [workspace:3](https://example.com).");
    });
});
