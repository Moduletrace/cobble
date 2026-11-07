import type { HarnessTool } from "@/src/harness/types";

type Params = {
    name: string;
    tools: Pick<HarnessTool, "name">[];
};

/**
 * Computer tools: the app's own shell and file tools and Playwright MCP's
 * browser tools, which only a task run on a computer has.
 */
const ComputerToolPattern = /^(?:computer_|browser_)/;

/**
 * What a call to a tool the run doesn't have gets back. A computer or
 * browser tool called from a run without one (a chat reply, seeing them in
 * its history's app records) is told to start a task: a weak model called
 * `browser_navigate` from a reply three times, then told the user it had
 * no browser.
 */
export default function unknownToolMessage({ name, tools }: Params) {
    const available = `Available: ${tools.map((t) => t.name).join(", ") || "none"}.`;

    if (!ComputerToolPattern.test(name)) {
        return `Error: There is no tool called "${name}". ${available}`;
    }

    const can_start = tools.some((t) => t.name == "start_task");

    return `Error: There is no tool called "${name}" here: computer and browser tools only exist in a task on a computer.${
        can_start
            ? " To use the computer or its browser (an open tab, a site the user is logged in to), call start_task with a clear brief, then tell the user what you're doing. You can use the computer that way; never say you can't."
            : ""
    } ${available}`;
}
