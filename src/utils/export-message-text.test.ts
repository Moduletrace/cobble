import { describe, expect, test } from "bun:test";
import exportMessageText from "./export-message-text";

const names = { bot_names: { 3: "Ada" }, workspace_names: { 2: "Launch" } };

describe("exportMessageText", () => {
    test("words refs, naming what is known", () => {
        expect(
            exportMessageText({
                text: "[bot:3] and [bot:9] in [workspace:2] on [computer:4], see [file:12] and [folder:computer:4:seo/raw]. [take-over:4:browser]",
                ...names,
                heading_offset: 0,
            }),
        ).toBe("@Ada and a bot in #Launch on computer 4, see file 12 and `seo/raw`. (take over computer 4, browser)");
    });

    test("leaves refs that are already links alone", () => {
        expect(exportMessageText({ text: "[bot:3](#x)", ...names, heading_offset: 0 })).toBe("[bot:3](#x)");
    });

    test("drops headings, capped at six", () => {
        expect(
            exportMessageText({ text: "# Top\n## Next\n##### Deep\n#nottag", ...names, heading_offset: 3 }),
        ).toBe("#### Top\n##### Next\n###### Deep\n#nottag");
    });

    test("leaves code blocks exactly as they are", () => {
        const text = "```bash\n# comment [bot:3]\n```\n# Title\n~~~~\n## also code\n~~~\n~~~~";

        expect(exportMessageText({ text, ...names, heading_offset: 3 })).toBe(
            "```bash\n# comment [bot:3]\n```\n#### Title\n~~~~\n## also code\n~~~\n~~~~",
        );
    });
});
