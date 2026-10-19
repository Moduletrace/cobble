import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import speechText from "./speech-text";

describe("speechText", () => {
    test("reads refs and markdown plainly", () => {
        expect(
            speechText({ text: "**Done.** Sign in on [computer:2]: [take-over:2:desktop]" }),
        ).toBe("Done. Sign in on a computer: a take-over link");
    });

    test("cuts long messages", () => {
        const out = speechText({ text: "a".repeat(AppData.SpeechMaxChars + 50) });

        expect(out.length).toBe(AppData.SpeechMaxChars + 1);
        expect(out.endsWith("…")).toBe(true);
    });
});
