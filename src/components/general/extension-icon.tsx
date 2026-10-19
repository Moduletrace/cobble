import { Plug, Wrench } from "lucide-react";
import type { BotExtension } from "@/src/types";

/**
 * The icon of an MCP server (a plug) or a tool (a wrench).
 */
export default function extensionIcon({ kind }: { kind: BotExtension["kind"] }) {
    return kind == "mcp" ? Plug : Wrench;
}
