import type { ExtensionAccess } from "@/src/types";

type Params = {
    access: ExtensionAccess;
};

/**
 * Who gets an MCP server or tool, in a few words: "Every bot",
 * "2 bots · 1 workspace", or "No bots yet".
 */
export default function extensionAccessLabel({ access }: Params) {
    if (access.all_bots) return "Every bot";

    const parts = [
        access.bot_ids.length ? `${access.bot_ids.length} ${access.bot_ids.length == 1 ? "bot" : "bots"}` : "",
        access.workspace_ids.length
            ? `${access.workspace_ids.length} ${access.workspace_ids.length == 1 ? "workspace" : "workspaces"}`
            : "",
    ].filter(Boolean);

    return parts.join(" · ") || "No bots yet";
}
