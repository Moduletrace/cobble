import { describe, expect, test } from "bun:test";
import unsupportedAppRecordLines from "./app-record-claims";

const start_task = { name: "start_task", ok: true };

describe("unsupportedAppRecordLines", () => {
    test("faults the line that names a tool the reply never called", () => {
        const text = "I'm checking your inbox now.\n\n[App record: this message's run called start_task.]";

        expect(unsupportedAppRecordLines({ text, tool_uses: [] }).length).toBe(1);
    });

    test("leaves a line the reply's record supports alone: the bot quoting what it wrote before it ran anything", () => {
        const text = "That line was mine, not the app's:\n\n[App record: this message's run called start_task.]";

        expect(unsupportedAppRecordLines({ text, tool_uses: [start_task] })).toEqual([]);
    });

    test("the app's honest line for a run that called nothing claims nothing", () => {
        for (const line of [
            "[App record: this message's run called no tools.]",
            "[App record: this message's run called none.]",
        ]) {
            expect(unsupportedAppRecordLines({ text: `Nothing ran.\n\n${line}`, tool_uses: [] })).toEqual([]);
        }
    });

    test("counts and failure notes in the app's shape don't hide a name", () => {
        const text = "[App record: this message's run called computer_bash x2 (1 failed), start_task.]";

        expect(unsupportedAppRecordLines({ text, tool_uses: [{ name: "computer_bash", ok: false }] }).length).toBe(1);
        expect(
            unsupportedAppRecordLines({
                text,
                tool_uses: [
                    { name: "computer_bash", ok: false },
                    start_task,
                ],
            }),
        ).toEqual([]);
    });

    test("a record-shaped line in words the app never writes stays suspect", () => {
        expect(
            unsupportedAppRecordLines({
                text: "[App record: start_task was called here]",
                tool_uses: [start_task],
            }).length,
        ).toBe(1);
    });

    test("nothing outside a record line is a record: the phrase in a sentence, a quote or a code span", () => {
        const mentioned = [
            'I wrote a fake "[App record: ...]" line claiming a clone I never did.',
            "The app adds a line shaped `[App record: ...]`, never me.",
            "Read the note the app calls [App record: ...] below your message.",
        ];

        for (const text of mentioned) {
            expect(unsupportedAppRecordLines({ text, tool_uses: [] })).toEqual([]);
        }
    });
});
