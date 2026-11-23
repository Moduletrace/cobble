import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import BotComputerPreview from "./bot-computer-preview";

function render() {
    return renderToString(
        <BotComputerPreview
            computer_id={7}
            name="Dev box"
            onOpen={() => {}}
        />,
    );
}

describe("BotComputerPreview", () => {
    test("it shows the computer's live browser, view only", () => {
        const html = render();

        expect(html).toContain('src="/computers/7/desktop/"');
        expect(html).toContain("pointer-events-none");
    });

    test("a click opens it in the viewer", () => {
        const html = render();

        expect(html).toContain('aria-label="Open Dev box in the viewer"');
    });
});