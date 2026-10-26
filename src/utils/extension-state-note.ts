import type { BotExtension } from "@/src/types";

type Params = {
    item: Pick<BotExtension, "kind" | "state" | "enabled">;
};

/**
 * What an extension's row says about whether it works: off, not working,
 * not checked yet, or nothing when it's fine. A skill has nothing to
 * connect or run, so it never reports a failure; a knowledgebase reports a
 * document it couldn't read.
 */
export default function extensionStateNote({ item }: Params) {
    if (!item.enabled) return "Off for every bot";
    if (item.kind == "skill") return "";
    if (item.kind == "knowledgebase") return item.state == "error" ? "A document couldn't be read" : "";
    if (item.state == "error") return "Not working";
    if (item.state == "untested") return "Not checked yet";

    return "";
}
