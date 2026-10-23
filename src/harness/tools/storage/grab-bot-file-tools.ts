import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import grabRunScopes from "@/src/functions/backend/db/bot-files/grab-run-scopes";
import type { StorageScope } from "@/src/utils/storage-access";
import type { HarnessTool } from "../../types";
import generateImageTool from "./generate-image-tool";
import grabStorageTools from "./grab-storage-tools";
import makePdfTool from "./make-pdf-tool";
import storageToolContext from "./storage-tool-context";

type Params = {
    bot: Pick<BUN_SQLITE_COBBLE_BOTS, "id" | "kind">;
    user_id: number | string;
    workspace_id?: number | string | null;
    session_id?: number | string;
    /**
     * The files the run reaches, when the caller already read them
     * (`grabRunScopes`); read here otherwise.
     */
    scopes?: StorageScope[];
    /**
     * Called for a file the bot wrote with "attach" set, so the reply
     * carries it.
     */
    onAttach?: (params: { media_id: number; name: string }) => void;
};

/**
 * The tools a bot uses to keep and search files (`src/harness/tools/
 * storage/`): listing, reading, writing, moving, deleting and searching
 * its own directory and, in a workspace or as the coordinator, the shared
 * ones, plus making images and PDFs into them. Every run gets them, so a
 * chat reply, a task and a scheduled run all work with the same files.
 */
export default async function grabBotFileTools({
    bot,
    user_id,
    workspace_id,
    session_id,
    scopes,
    onAttach,
}: Params): Promise<HarnessTool[]> {
    const context = storageToolContext({
        bot,
        user_id,
        workspace_id,
        session_id,
        scopes: scopes || (await grabRunScopes({ bot, user_id, workspace_id })),
        onAttach,
    });

    return [...grabStorageTools(context), generateImageTool(context), makePdfTool(context)];
}
