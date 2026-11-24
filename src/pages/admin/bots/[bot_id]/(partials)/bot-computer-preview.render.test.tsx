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
    /**
     * The block is always there, at its usual size; only the live stream
     * waits for Preview, since it is a stream nobody asked for.
     */
    test("it keeps the block and holds its screen until asked", () => {
        const html = render();

        expect(html).toContain("h-[250px]");
        expect(html).toContain("Preview");
        expect(html).not.toContain("/computers/7/");
    });
});