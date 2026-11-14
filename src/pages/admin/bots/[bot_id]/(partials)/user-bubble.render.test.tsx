import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import UserBubble from "./user-bubble";

function render({ text }: { text: string }) {
    return renderToString(<UserBubble text={text} />);
}

describe("UserBubble", () => {
    test("renders the user's markdown in the ink bubble", () => {
        const html = render({ text: "**Ship it** tonight" });

        expect(html).toContain("font-bold\">Ship it");
        expect(html).toContain("conversation-user-bubble");
    });

    test("cuts the text to twenty lines, with no button before it's measured", () => {
        const html = render({ text: "a long prompt\n\n".repeat(60) });

        expect(html).toContain("max-h-[25rem]");
        expect(html).toContain("overflow-hidden");
        // The server has no layout: "Read more" appears once measured.
        expect(html).not.toContain("Read more");
    });
});