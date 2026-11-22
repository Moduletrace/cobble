import type { HarnessTool } from "../types";
import { ToolGroups } from "./tool-groups";

/**
 * Names the bot's own tools into their families (`ToolGroups`) so a run
 * with a narrow window can defer whole families and load them by name
 * (`runTextLoop` decides by size, so a model with room keeps them all
 * inline). A tool in no family is left alone, and one an extension already
 * deferred keeps its own flag.
 */
export default function groupTools({ tools }: { tools: HarnessTool[] }): HarnessTool[] {
    const group_of = new Map<string, string>();

    for (const [group, names] of Object.entries(ToolGroups)) {
        for (const name of names) {
            if (!group_of.has(name)) group_of.set(name, group);
        }
    }

    return tools.map((tool) => {
        const group = group_of.get(tool.name);

        return group ? { ...tool, group, deferred: true } : tool;
    });
}
