import { AppData } from "@/src/data/app-data";
import type { BotWithLastMessage, WorkspaceWithActivity } from "@/src/types";
import type { ComposerMentionKind } from "../(data)/composer-mention-kinds";

/**
 * One thing the mention menu offers.
 */
export type ComposerMentionItem = {
    id: number;
    label: string;
    bot?: BotWithLastMessage;
    workspace?: WorkspaceWithActivity;
};

type Params = {
    kind: ComposerMentionKind;
    query: string;
    bots: BotWithLastMessage[];
    workspaces: WorkspaceWithActivity[];
};

/**
 * The bots or workspaces whose name has what was typed, names starting
 * with it first, at most `AppData.ComposerMentionMaxItems`.
 */
export default function searchMentionItems({ kind, query, bots, workspaces }: Params): ComposerMentionItem[] {
    const items: ComposerMentionItem[] =
        kind == "bot"
            ? bots
                  .filter((bot) => bot.id && bot.name)
                  .map((bot) => ({ id: Number(bot.id), label: String(bot.name), bot }))
            : workspaces
                  .filter((workspace) => workspace.id && workspace.name && !workspace.archived)
                  .map((workspace) => ({ id: Number(workspace.id), label: String(workspace.name), workspace }));

    const q = query.trim().toLowerCase();

    return items
        .map((item) => ({ item, at: item.label.toLowerCase().indexOf(q) }))
        .filter(({ at }) => at >= 0)
        .sort((a, b) => Number(a.at != 0) - Number(b.at != 0) || a.item.label.localeCompare(b.item.label))
        .slice(0, AppData.ComposerMentionMaxItems)
        .map(({ item }) => item);
}
