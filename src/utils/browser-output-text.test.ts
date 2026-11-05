import { describe, expect, test } from "bun:test";
import browserOutputText from "./browser-output-text";

const output_dir = "/home/gem/.cobble/playwright";

describe("browserOutputText", () => {
    test("points a snapshot and the console log at the tools that read them", () => {
        const text = [
            "### Snapshot",
            `- [Snapshot](${output_dir}/page-2026-11-05T15-01-39-831Z.yml)`,
            "### Events",
            `- New console entries: ${output_dir}/console-2026-11-05T15-00-31-968Z.log#L1-L2`,
        ].join("\n");

        expect(browserOutputText({ text, output_dir })).toBe(
            [
                "### Snapshot",
                "- Not shown here: call browser_snapshot to read the page",
                "### Events",
                "- New console entries: read them with browser_console_messages",
            ].join("\n"),
        );
    });

    test("leaves out a screenshot's link (the image is shown)", () => {
        const text = ["### Result", `- [Screenshot of viewport](${output_dir}/page-1.png)`, "done"].join("\n");

        expect(browserOutputText({ text, output_dir })).toBe(["### Result", "done"].join("\n"));
    });

    test("keeps links to files in the run's folders", () => {
        const text = "- [Screenshot of viewport](/home/gem/workspace/bots/1/users/2/shot.png)";

        expect(browserOutputText({ text, output_dir })).toBe(text);
    });
});
