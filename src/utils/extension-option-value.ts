import type { BotExtension } from "@/src/types";

/**
 * An MCP server or tool as one select value (`mcp:3`), and back.
 */
export function extensionOptionValue({ kind, id }: { kind: BotExtension["kind"]; id: number }) {
    return `${kind}:${id}`;
}

export function parseExtensionOptionValue({ value }: { value: string }) {
    const [kind, id] = value.split(":");

    if ((kind != "mcp" && kind != "tool") || !Number(id)) return null;

    return { kind: kind as BotExtension["kind"], id: Number(id) };
}
