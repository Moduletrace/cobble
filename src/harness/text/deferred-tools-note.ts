import { AppData } from "@/src/data/app-data";
import type { HarnessTool } from "../types";
import { LoadToolsToolName } from "../tools/load-tools-tool";

/**
 * The system prompt's list of the tools a run may load (`load_tools`):
 * each by name with the start of its description, so the model knows
 * what is there without every definition riding along on each turn.
 */
export default function deferredToolsNote({ tools }: { tools: HarnessTool[] }) {
    const lines = tools.map((tool) => `- ${tool.name}: ${shortDescription({ text: tool.description })}`);

    return `Tools you can load: these are available to you but not loaded yet, to keep each step small. Call ${LoadToolsToolName} with the names you need (one call can load several), then call them. Don't load what you won't use.\n${lines.join("\n")}`;
}

function shortDescription({ text }: { text: string }) {
    const line = text.trim().split("\n")[0]!.trim();
    const max = AppData.HarnessDeferredToolLineChars;

    return line.length > max ? `${line.slice(0, max - 3).trimEnd()}...` : line;
}
