import type { HarnessTool } from "@/src/harness/types";

type Params = {
    name: string;
    tools: Pick<HarnessTool, "name">[];
};

/**
 * Computer tools: the app's own shell and file tools and Playwright MCP's
 * browser tools, which only a task run on a computer has. A user's own
 * browser is named with its slug (`<slug>__browser_navigate`), so the prefix
 * test is not enough to know a call wanted the computer's browser.
 */
const ComputerToolPattern = /^(?:computer_|browser_)/;
const WantsBrowserPattern = /(?:^|__)browser_/;
/** A user's own browser's tool, named under the browser's slug. */
const SlugBrowserPattern = /__browser_/;

/**
 * What a call to a tool the run doesn't have gets back. A computer or
 * browser tool called from a run without one (a chat reply, seeing them in
 * its history's app records) is told to start a task: a weak model called
 * `browser_navigate` from a reply three times, then told the user it had
 * no browser.
 */
export default function unknownToolMessage({ name, tools }: Params) {
    const available = `Available: ${tools.map((t) => t.name).join(", ") || "none"}.`;

    /**
     * A reply with the user's own browser does have browser tools, just under
     * the browser's slug: telling it they only exist in a task was a lie that
     * ended with "I have no browser" (production, Nov 2026). A task run's own
     * `browser_*` tools carry no slug, so they keep the message below.
     */
    const own = WantsBrowserPattern.test(name) ? tools.find((t) => SlugBrowserPattern.test(t.name)) : undefined;

    if (own) {
        return `Error: There is no tool called "${name}". Your browser tools carry the browser's slug, e.g. "${own.name}". ${available}`;
    }

    if (!ComputerToolPattern.test(name)) {
        return `Error: There is no tool called "${name}". ${available}`;
    }

    const can_reply = tools.some((t) => t.name == "send_reply");
    const can_start = tools.some((t) => t.name == "start_task");
    const way = can_reply
        ? `call send_reply with status "working" and work`
        : can_start
          ? "call start_task with a clear brief"
          : "";

    return `Error: There is no tool called "${name}" here: computer and browser tools only exist in a task on a computer.${
        way
            ? ` To use the computer or its browser (an open tab, a site the user is logged in to), ${way}, then tell the user what you're doing. You can use the computer that way; never say you can't.`
            : ""
    } ${available}`;
}
