import { useContext, useEffect, useState } from "react";
import { AppContext } from "@/src/pages/__root";
import type { PublicBotFile } from "@/src/types";
import { fetchBotFile, useBotFilePlace } from "./use-bot-file";

/**
 * The bot files a message names by id, in the ids' order: the page's own
 * files first, the rest fetched once per id through the same cache the
 * chips use. Null for one still loading, one the user doesn't reach, or
 * one deleted since. The ids come from the message's text, so they hold
 * still while it does (`useMemo` on the caller's side).
 */
export default function useReferencedFiles({ file_ids }: { file_ids: number[] }): (PublicBotFile | null)[] {
    const { pageProps } = useContext(AppContext);
    const known_files = pageProps?.bot_files?.files;
    const { bot_id, workspace_id } = useBotFilePlace();
    const [fetched_files, setFetchedFiles] = useState<Map<number, PublicBotFile | null>>(new Map());
    const ids_key = file_ids.join(",");

    useEffect(() => {
        const missing = file_ids.filter((id) => !known_files?.some((it) => it.id == id));

        if (!bot_id || !missing.length) return;

        let live = true;

        Promise.all(
            missing.map((file_id) =>
                fetchBotFile({ file_id, bot_id, workspace_id }).then((file) => [file_id, file] as const),
            ),
        ).then((entries) => {
            if (live) setFetchedFiles(new Map(entries));
        });

        return () => {
            live = false;
        };
        // ids_key stands in for file_ids: a new array of the same ids is
        // the same lookup.
    }, [ids_key, bot_id, workspace_id, known_files]);

    return file_ids.map((id) => known_files?.find((it) => it.id == id) || fetched_files.get(id) || null);
}
