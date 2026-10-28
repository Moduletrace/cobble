import { describe, expect, test } from "bun:test";
import botRef from "./bot-ref";
import workspaceRef from "./workspace-ref";
import computerRef from "./computer-ref";
import linkComputerRefs from "./link-computer-refs";
import hookProposalRef from "./hook-proposal-ref";
import proposalRef from "./proposal-ref";
import secretRef from "./secret-ref";
import secretRequestRef from "./secret-request-ref";
import botQuestionRef from "./bot-question-ref";
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

    test("links proposals", () => {
        expect(linkComputerRefs({ text: `Review it: ${proposalRef({ id: 7 })}` })).toBe(
            "Review it: [proposal 7](#proposal-7)",
        );
    });

    test("links hook proposals apart from extension proposals", () => {
        expect(
            linkComputerRefs({ text: `${hookProposalRef({ id: 4 })} and ${proposalRef({ id: 4 })}` }),
        ).toBe("[hook proposal 4](#hook-proposal-4) and [proposal 4](#proposal-4)");
    });

    test("links secrets and secret requests, never confusing the two", () => {
        expect(
            linkComputerRefs({ text: `${secretRef({ id: 12 })} and ${secretRequestRef({ id: 4 })}` }),
        ).toBe("[secret 12](#secret-ref-12) and [secret request 4](#secret-request-4)");
    });

    test("links questions a bot asked, also when quoted alone in code", () => {
        expect(linkComputerRefs({ text: `Before I start: ${botQuestionRef({ id: 4 })}` })).toBe(
            "Before I start: [questions 4](#question-4)",
        );
        expect(linkComputerRefs({ text: "See `[question:4]`" })).toBe("See [questions 4](#question-4)");
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

describe("linkComputerRefs and code", () => {
    test("a ref quoted alone in a code span is the ref", () => {
        expect(linkComputerRefs({ text: "saved as `[file:131]` today" })).toBe("saved as [file 131](#file-131) today");
        expect(linkComputerRefs({ text: "see `` [room:4] ``" })).toBe("see [room 4](#room-4)");
    });

    test("refs inside longer code stay as written", () => {
        expect(linkComputerRefs({ text: "write `[file:3] here` like so" })).toBe("write `[file:3] here` like so");
        expect(linkComputerRefs({ text: "```\n[bot:2]\n```\nthen [bot:2]" })).toBe(
            "```\n[bot:2]\n```\nthen [bot 2](#bot-2)",
        );
    });
});
