import {
    JobStepBrowserToolInfix,
    JobStepToolLabels,
    JobStepToolPrefixLabels,
} from "@/src/dict/bot-queue-dict";

type Params = {
    /**
     * A tool's name, e.g. `computer_bash` or `<server>__<tool>`.
     */
    name: string;
};

/**
 * What a tool call does, in plain words: the app's own label for the tools
 * it ships (`JobStepToolLabels`), a family's for anything matching its
 * prefix (`JobStepToolPrefixLabels`: every browser tool reads "Using the
 * browser"), else the name in words. Used for the live step line and for a
 * message's tool rollup, so the two never drift.
 */
export default function toolLabel({ name }: Params) {
    if (name.includes(JobStepBrowserToolInfix)) return JobStepToolPrefixLabels.browser_ as string;

    const prefix = Object.keys(JobStepToolPrefixLabels).find((p) => name.startsWith(p));

    return JobStepToolLabels[name] || (prefix && JobStepToolPrefixLabels[prefix]) || `Using ${readableToolName({ name })}`;
}

/**
 * A tool name in words: `get_weather` reads "get weather", and an MCP
 * server's `<slug>__<tool>` reads "Exa search (web search exa)".
 */
function readableToolName({ name }: { name: string }) {
    const words = (part: string) => part.replace(/_+/g, " ").trim();
    const [server, ...rest] = name.split("__");
    const tool = words(rest.join(" "));

    if (!tool) return words(name);

    const server_words = words(server || "");

    return `${server_words.charAt(0).toUpperCase()}${server_words.slice(1)} (${tool})`;
}