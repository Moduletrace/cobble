import type { BotExtension } from "@/src/types";

type Params = {
    kind: BotExtension["kind"];
    /**
     * With the article, for a sentence: "the tool", "the MCP server".
     */
    article?: boolean;
};

/**
 * What an extension kind is called in copy: a tool, an MCP server or a
 * skill.
 */
export default function extensionNoun({ kind, article }: Params) {
    const noun = kind == "mcp" ? "MCP server" : kind == "skill" ? "skill" : "tool";

    return article ? `the ${noun}` : noun;
}

type TitleParams = {
    kind: BotExtension["kind"];
    /**
     * What happened, in one word: "added", "removed".
     */
    verb: string;
};

/**
 * A log entry's title: "MCP server added", "Skill removed".
 */
export function extensionLogTitle({ kind, verb }: TitleParams) {
    const noun = extensionNoun({ kind });

    return `${noun.charAt(0).toUpperCase()}${noun.slice(1)} ${verb}`;
}
