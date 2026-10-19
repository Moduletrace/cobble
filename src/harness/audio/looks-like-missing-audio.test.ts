import { describe, expect, test } from "bun:test";
import looksLikeMissingAudio from "./looks-like-missing-audio";

describe("looksLikeMissingAudio", () => {
    test("spots a model asking for the audio it never got", () => {
        for (const text of [
            "Please provide the audio file you’d like transcribed.",
            "I’m sorry, but I can’t transcribe without the audio.",
            "I cannot hear any audio in your message.",
            "There is no audio attached.",
            "I didn't receive any audio.",
        ]) {
            expect(looksLikeMissingAudio({ text })).toBe(true);
        }
    });

    test("leaves real transcripts alone", () => {
        expect(looksLikeMissingAudio({ text: "Hello from cobble." })).toBe(
            false,
        );
        expect(
            looksLikeMissingAudio({
                text: `Can you send the audio report to finance? ${"And then more. ".repeat(30)}`,
            }),
        ).toBe(false);
    });
});
