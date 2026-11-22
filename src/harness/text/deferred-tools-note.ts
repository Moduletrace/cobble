import { AppData } from "@/src/data/app-data";
import type { HarnessTool } from "../types";
import { LoadToolsToolName } from "../tools/load-tools-tool";

/**
 * The system prompt's list of the tools a run may load (`load_tools`): the
 * bot's own tools by family, each with the names in it, and every extension
 * tool by name with the start of its description, so the model knows what is
 * there without every definition riding along on each turn.
 */
export default function deferredToolsNote({ tools }: { tools: HarnessTool[] }) {
    const families = new Map<string, string[]>();
    const loose: HarnessTool[] = [];

    for (const tool of tools) {
        if (!tool.group) {
            loose.push(tool);
            continue;
        }

        families.set(tool.group, [...(families.get(tool.group) ?? []), tool.name]);
    }

    const lines = [
        ...[...families].map(([group, names]) => `- ${group}: ${names.join(", ")} (load the family by its name)`),
        ...loose.map((tool) => `- ${tool.name}: ${shortDescription({ text: tool.description })}`),
    ];

    return `Tools you can load: these are available to you but not loaded yet, to keep each step small. Call ${LoadToolsToolName} with what you need (one call can load several), then call them: exact names, a family's name for all of it, or "<prefix>*". Don't load what you won't use.\n${lines.join("\n")}`;
}

function shortDescription({ text }: { text: string }) {
    const line = text.trim().split("\n")[0]!.trim();
    const max = AppData.HarnessDeferredToolLineChars;

    return line.length > max ? `${line.slice(0, max - 3).trimEnd()}...` : line;
}
