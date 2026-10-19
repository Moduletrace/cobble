import { ReservedToolNames, ReservedToolPrefixes } from "@/src/dict/custom-tool-dict";

type Params = {
    name: string;
};

/**
 * Why a custom tool can't take this name, or null when it can: snake_case
 * of 2 to 64 characters, never a built-in tool's name or a computer tool's
 * prefix, and never with `__` (MCP tools use it, `<server>__<tool>`).
 */
export default function checkCustomToolName({ name }: Params): string | null {
    if (!/^[a-z][a-z0-9_]{1,63}$/.test(name)) {
        return `Use lowercase letters, numbers and underscores, starting with a letter (2 to 64 characters).`;
    }

    if (name.includes("__")) return `Don't use a double underscore: MCP tools use it.`;

    if ((ReservedToolNames as readonly string[]).includes(name)) {
        return `${name} is a built-in tool's name.`;
    }

    const prefix = ReservedToolPrefixes.find((p) => name.startsWith(p));

    if (prefix) return `Names starting with ${prefix} are kept for computers' tools.`;

    return null;
}
