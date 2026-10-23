import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import type { BotComputers } from "../(hooks)/use-bot-computers";
import { BotComputersContext } from "../(data)/bot-computers-context";
import ComputerRefChip from "./computer-ref-chip";

const main: BUN_SQLITE_COBBLE_COMPUTERS = { id: 1, name: "Main computer" };
const sandbox: BUN_SQLITE_COBBLE_COMPUTERS = { id: 2, name: "SEO box" };

type RenderProps = {
    computer_id: number;
    computers: BUN_SQLITE_COBBLE_COMPUTERS[];
};

function render({ computer_id, computers }: RenderProps) {
    const value = makeComputers({ computers });

    const html = renderToString(
        <BotComputersContext.Provider value={value}>
            <ComputerRefChip computer_id={computer_id} />
        </BotComputersContext.Provider>,
    );

    return { html, value };
}

type MakeComputersProps = {
    computers: BUN_SQLITE_COBBLE_COMPUTERS[];
};

/**
 * A computers context recording what the chip asked for: the viewer it
 * opened and the switches it made.
 */
function makeComputers({ computers }: MakeComputersProps) {
    const switches: number[] = [];
    const opened: { computer_id: number; mode: string }[] = [];

    const value: BotComputers = {
        computers,
        switchComputer: async ({ computer_id }) => {
            switches.push(computer_id);
        },
        openComputer: (params) => {
            opened.push(params);
        },
        closeComputer: () => {},
    };

    return Object.assign(value, { switches, opened });
}

describe("ComputerRefChip", () => {
    test("opens the viewer in its browser and switches nothing", async () => {
        const { html, value } = render({
            computer_id: 2,
            computers: [main, sandbox],
        });

        expect(html).toContain("SEO box");
        // The chip's only job is opening, so no switch affordance survives.
        expect(html).not.toContain("Switch to");
        expect(value.switches).toHaveLength(0);
    });

    test("the computer the bot is on is still a chip, sunken with a check", () => {
        const { html } = render({ computer_id: 1, computers: [main, sandbox] });

        expect(html).toContain("Main computer");
        expect(html).toContain("<button");
        expect(html).toContain("bg-sunken");
        expect(html).toContain('title="Open Main computer"');
    });

    test("a computer the bot can't use stays a plain name", () => {
        const { html } = render({ computer_id: 9, computers: [main] });

        expect(html).toContain("computer 9");
        expect(html).not.toContain("<button");
    });
});
