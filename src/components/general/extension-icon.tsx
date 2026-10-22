import { BookOpen, Plug, Wrench } from "lucide-react";
import type { BotExtension } from "@/src/types";

/**
 * The icon of an MCP server (a plug), a tool (a wrench) or a skill (a book).
 */
export default function extensionIcon({ kind }: { kind: BotExtension["kind"] }) {
    if (kind == "mcp") return Plug;
    if (kind == "skill") return BookOpen;

    return Wrench;
}
