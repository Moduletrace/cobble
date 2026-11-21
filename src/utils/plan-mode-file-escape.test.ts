import { describe, expect, test } from "bun:test";
import planModeFileEscape from "./plan-mode-file-escape";

describe("planModeFileEscape", () => {
    test("faults a made-up missing write tool", () => {
        expect(
            planModeFileEscape({
                text: "Since I don't have a `write_file` tool available in this environment, here's the complete document for you to save:",
            }),
        ).toBe("missing_tool");
    });

    test("faults a write tool called unavailable", () => {
        expect(planModeFileEscape({ text: "write_file is not available in this environment." })).toBe("missing_tool");
    });

    test("faults asking the user to save it", () => {
        expect(planModeFileEscape({ text: "Here is the roadmap for you to save." })).toBe("save_it_yourself");
    });

    test("faults telling the user they will have to save the document", () => {
        expect(planModeFileEscape({ text: "You'll need to save the document yourself." })).toBe("save_it_yourself");
    });

    test("leaves an offer to save alone", () => {
        expect(
            planModeFileEscape({
                text: "Plan mode stops me saving files. Shall I save it as a document once you turn it off?",
            }),
        ).toBeNull();
    });

    test("leaves a short template alone", () => {
        expect(planModeFileEscape({ text: "Here is the template:\n\n# Company\nName: [NAME]" })).toBeNull();
    });
});