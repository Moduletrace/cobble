import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import RunLimitInput from "./run-limit-input";

const base = {
    id: "reply_steps",
    label: "Tool steps per chat reply",
    value: "20",
    suffix: "steps",
    info: "How many turns a chat reply may take.",
    onChange: () => {},
    onUnlimitedChange: () => {},
};

describe("RunLimitInput", () => {
    test("labels the field and keeps its own No limit switch beside the number", () => {
        const html = renderToString(<RunLimitInput {...base} unlimited={false} />);

        expect(html).toContain("No limit");
        expect(html).toContain(`id="reply_steps"`);
        expect(html).toContain(`<label for="reply_steps"`);
        expect(html).toContain("Tool steps per chat reply</label>");
        expect(html).toContain("How many turns a chat reply may take.");
        expect(html).toContain(`value="20"`);
        expect(html).toContain("lucide-minus");
        expect(html).not.toContain("disabled");
    });

    test("reads a limit that's off as Unlimited, in a dead field", () => {
        const html = renderToString(<RunLimitInput {...base} value="" unlimited />);

        expect(html).toContain(`value="Unlimited"`);
        expect(html).toContain("disabled");
        expect(html).toContain("opacity-40");
        expect(html).not.toContain("lucide-minus");
    });
});