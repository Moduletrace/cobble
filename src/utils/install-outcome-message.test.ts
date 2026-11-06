import { describe, expect, test } from "bun:test";
import installOutcomeMessage from "./install-outcome-message";

describe("installOutcomeMessage", () => {
    test("installed: says so, with the note, and to carry on", () => {
        const text = installOutcomeMessage({ request_id: 2, status: "installed", asked: "apt: jq", answer: "jq 1.7 is on the PATH." });

        expect(text).toStartWith("I installed what you asked for (request #2: apt: jq).");
        expect(text).toContain("jq 1.7 is on the PATH.");
        expect(text).toContain("start the task again");
    });

    test("refused and failed say not to just ask again", () => {
        expect(installOutcomeMessage({ request_id: 2, status: "refused", asked: "apt: x", answer: "Adds a repo." })).toContain(
            "Don't ask for the same again.",
        );
        expect(installOutcomeMessage({ request_id: 2, status: "failed", asked: "apt: x" })).toContain("didn't get an answer");
    });
});
