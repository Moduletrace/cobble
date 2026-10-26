import { Library, Wrench } from "lucide-react";
import type { ComposerExtensionsCopy } from "../(partials)/composer-tools-modal";

/**
 * The composer's tools button: MCP servers, tools and skills.
 */
export function composerToolsCopy({ bot_name }: { bot_name: string }): ComposerExtensionsCopy {
    return {
        id: "composer-add-extension",
        Icon: Wrench,
        one: "tool",
        many: "tools",
        empty_label: "Add tools",
        title: `Tools ${bot_name} can use here`,
        some: "MCP servers, tools and skills it was given, plus this workspace's. Remove one to take it away, or add another below.",
        none: "It has none yet. Give it an MCP server, tool or skill below, or make one under Settings.",
        add_hint: `Give ${bot_name} another one. It can use it everywhere it works, for everyone it works for.`,
        add_noun: "tool, MCP server or skill",
    };
}

/**
 * The composer's knowledgebases button, beside the tools.
 */
export function composerKnowledgebasesCopy({ bot_name }: { bot_name: string }): ComposerExtensionsCopy {
    return {
        id: "composer-add-knowledgebase",
        Icon: Library,
        one: "knowledgebase",
        many: "knowledgebases",
        empty_label: "Add knowledge",
        title: `Knowledgebases ${bot_name} searches here`,
        some: "Before it answers, it searches these for passages that fit, and it can search them again while it works. Remove one to take it away, or add another below.",
        none: "It has none yet. Give it a knowledgebase below, or make one under Settings, under Knowledgebases.",
        add_hint: `Give ${bot_name} another one. It searches it everywhere it works, for everyone it works for.`,
        add_noun: "knowledgebase",
    };
}
