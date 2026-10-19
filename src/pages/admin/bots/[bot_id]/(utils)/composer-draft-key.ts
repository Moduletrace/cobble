import { AppData } from "@/src/data/app-data";

type Params = {
    bot_id?: number | "" | null;
    workspace_id?: number | null;
    part: "text" | "files";
};

/**
 * The `localStorage` key of one part of a conversation's unsent draft.
 */
export default function composerDraftKey({ bot_id, workspace_id, part }: Params) {
    return `${AppData.ComposerDraftStorageKey}:${bot_id || 0}:${workspace_id || 0}:${part}`;
}
