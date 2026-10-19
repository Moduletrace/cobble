import { describe, expect, test } from "bun:test";
import composeJobBrief from "./compose-job-brief";

describe("composeJobBrief", () => {
    test("puts the title, instructions and parameters in order", () => {
        expect(
            composeJobBrief({
                title: "Tidy invoices",
                instructions: " Rename every PDF by date. ",
                params: { folder: "~/invoices" },
            }),
        ).toBe(
            [
                "# Job: Tidy invoices",
                "Rename every PDF by date.",
                '## Parameters\n\n```json\n{\n  "folder": "~/invoices"\n}\n```',
                "Work on this until it's done. Then reply to the user with the result: what you did, and anything they need to know or do.",
            ].join("\n\n"),
        );
    });

    test("leaves out empty parts", () => {
        expect(composeJobBrief({ params: {} })).toStartWith(
            "# Job: Untitled\n\nWork on this",
        );
    });
});
