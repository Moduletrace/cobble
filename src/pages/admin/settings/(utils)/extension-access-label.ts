import type { ExtensionAccess } from "@/src/types";

type Params = {
    access: ExtensionAccess;
};

/**
 * Who gets an MCP server or tool, in a few words: "2 bots · 1 workspace",
 * "Every bot by default · 5 bots", or "No bots yet".
 */
export default function extensionAccessLabel({ access }: Params) {
    const parts = [
        access.all_bots ? "Every bot by default" : "",
        access.bot_ids.length ? `${access.bot_ids.length} ${access.bot_ids.length == 1 ? "bot" : "bots"}` : "",
        access.workspace_ids.length
            ? `${access.workspace_ids.length} ${access.workspace_ids.length == 1 ? "workspace" : "workspaces"}`
            : "",
    ].filter(Boolean);

    return parts.join(" · ") || "No bots yet";
}
