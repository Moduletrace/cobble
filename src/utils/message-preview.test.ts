import { describe, expect, test } from "bun:test";
import messagePreview from "./message-preview";

describe("messagePreview", () => {
    test("strips markdown and names computers plainly", () => {
        expect(
            messagePreview({
                text: "## Found it\n\nYour **GitHub** session is on [computer:3]. See [the docs](https://x.y) and `search_computers`.\n\n- *one*\n- two",
            }),
        ).toBe("Found it Your GitHub session is on a computer. See the docs and search_computers. one two");
    });

    test("names bots plainly", () => {
        expect(messagePreview({ text: "[bot:4] is on it." })).toBe("a bot is on it.");
        expect(messagePreview({ text: "Moved to [workspace:2]." })).toBe("Moved to a workspace.");
    });

    test("keeps code text without its fences", () => {
        expect(messagePreview({ text: "Run:\n```bash\nls ~\n```" })).toBe("Run: ls ~");
    });

    test("leaves plain text alone", () => {
        expect(messagePreview({ text: "All done, 3 files_moved." })).toBe("All done, 3 files_moved.");
    });
});
