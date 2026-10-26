import { BookOpen, Library, Plug, Wrench } from "lucide-react";
import type { BotExtension } from "@/src/types";

/**
 * The icon of an MCP server (a plug), a tool (a wrench), a skill (a book)
 * or a knowledgebase (a library).
 */
export default function extensionIcon({ kind }: { kind: BotExtension["kind"] }) {
    if (kind == "mcp") return Plug;
    if (kind == "skill") return BookOpen;
    if (kind == "knowledgebase") return Library;

    return Wrench;
}
