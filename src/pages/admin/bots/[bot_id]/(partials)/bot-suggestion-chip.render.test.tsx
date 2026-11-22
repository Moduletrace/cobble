import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import BotSuggestionChip from "./bot-suggestion-chip";

const longStep =
    "Write a full launch plan for next quarter with owners, deadlines and the review checkpoints for every team";

function render({ step }: { step: string }) {
    return renderToString(<BotSuggestionChip step={step} />);
}

describe("BotSuggestionChip", () => {
    test("shows the step and keeps it inside the chip", () => {
        const html = render({ step: longStep });

        expect(html).toContain(longStep);
        // The twui button's content wrapper is nowrap by default, which let a
        // long step spill out of the button's outline on a phone.
        expect(html).toContain("[&amp;_.twui-button-content-wrapper]:whitespace-normal");
        expect(html).toContain("[&amp;_.twui-button-content-wrapper]:min-w-0");
        expect(html).toContain("break-words");
        expect(html).toContain("max-w-full");
    });
});