import { AppData } from "@/src/data/app-data";
import type { HarnessTool } from "../types";
import { LoadToolsToolName } from "../tools/load-tools-tool";

/**
 * The system prompt's list of the tools a run may load (`load_tools`): the
 * bot's own tools by family, each with the names in it, and every extension
 * tool by name with the start of its description, so the model knows what is
 * there without every definition riding along on each turn.
 *
 * A namespace (one connector's or MCP server's tools) that offers many
 * tools is listed by name alone, on one line: one GitHub account's 905 tools
 * came to 148,000 characters with their descriptions, sent with every turn
 * of every run. Their names still cost 34,000 characters, which is the price
 * of a bot finding the one tool it needs without loading 905 definitions.
 */
export default function deferredToolsNote({ tools }: { tools: HarnessTool[] }) {
    const families = new Map<string, string[]>();
    const loose = new Map<string, HarnessTool[]>();

    for (const tool of tools) {
        if (tool.group) {
            families.set(tool.group, [...(families.get(tool.group) ?? []), tool.name]);
            continue;
        }

        const prefix = tool.name.includes("__") ? tool.name.slice(0, tool.name.indexOf("__")) : "";

        loose.set(prefix, [...(loose.get(prefix) ?? []), tool]);
    }

    const lines = [
        ...[...families].map(([group, names]) => `- ${group}: ${names.join(", ")} (load the family by its name)`),
        ...[...loose].flatMap(([prefix, names]) =>
            prefix && names.length >= AppData.HarnessDeferredNamespaceMin
                ? [`- ${prefix} (${names.length} tools): ${names.map((tool) => tool.name).join(", ")}`]
                : names.map((tool) => `- ${tool.name}: ${shortDescription({ text: tool.description })}`),
        ),
    ];

    return `Tools you can load: these are available to you but not loaded yet, to keep each step small. Call ${LoadToolsToolName} with what you need (one call can load several), then call them: exact names, a family's name for all of it, or "<prefix>*". Don't load what you won't use.\n${lines.join("\n")}`;
}

function shortDescription({ text }: { text: string }) {
    const line = text.trim().split("\n")[0]!.trim();
    const max = AppData.HarnessDeferredToolLineChars;

    return line.length > max ? `${line.slice(0, max - 3).trimEnd()}...` : line;
}