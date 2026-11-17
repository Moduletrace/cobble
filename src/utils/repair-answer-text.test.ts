import { describe, expect, test } from "bun:test";
import repairAnswerText from "./repair-answer-text";
import sanitizeAnswerText from "./sanitize-answer-text";

describe("sanitizeAnswerText", () => {
    test("takes out a pill that goes nowhere and keeps the rest", () => {
        expect(sanitizeAnswerText({ text: "Raise it in [setting:general:x] and it's done." })).toBe(
            "Raise it in  and it's done.",
        );
    });

    test("takes out an app record line the bot wrote itself", () => {
        expect(
            sanitizeAnswerText({
                text: "The scan is done.\n\n[App record: this message's run called start_task, read_file x2.]",
            }),
        ).toBe("The scan is done.");
    });

    test("leaves an answer that holds up alone", () => {
        expect(sanitizeAnswerText({ text: "Here it is: [file:12]." })).toBe("Here it is: [file:12].");
    });
});

describe("repairAnswerText", () => {
    test("takes out a claim of work under way and keeps the report", () => {
        const repaired = repairAnswerText({
            text: "Three contests are open. I'm scanning the rest now. The first closes on Friday.",
        });

        expect(repaired.changed).toBe(true);
        expect(repaired.text).toContain("Three contests are open.");
        expect(repaired.text).toContain("The first closes on Friday.");
        expect(repaired.text).not.toContain("scanning the rest");
    });

    test("takes out a promise of a report", () => {
        const repaired = repairAnswerText({ text: "Nothing to report yet. I'll report back when it's done." });

        expect(repaired.changed).toBe(true);
        expect(repaired.text).not.toContain("report back");
    });

    test("says it changed nothing when the answer holds up", () => {
        const repaired = repairAnswerText({ text: "The log has three timeouts at 09:12." });

        expect(repaired.changed).toBe(false);
        expect(repaired.text).toBe("The log has three timeouts at 09:12.");
    });
});