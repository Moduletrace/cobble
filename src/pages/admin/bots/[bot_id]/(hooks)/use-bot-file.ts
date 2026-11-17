import { useContext, useEffect, useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { AppContext } from "@/src/pages/__root";
import { FilePlaceContext } from "../(data)/file-place-context";
import type { BotFileScopesPayload, PublicBotFile } from "@/src/types";

/**
 * One file, fetched once per id: a message can name a file older than the
 * page's first page of them, and the chip still has to open it. Failures
 * are remembered too, so a deleted file doesn't refetch on every render.
 */
const fetched = new Map<number, Promise<PublicBotFile | null>>();

export function fetchBotFile({
    file_id,
    bot_id,
    workspace_id,
}: {
    file_id: number;
    bot_id: number;
    workspace_id?: number | null;
}) {
    const cached = fetched.get(file_id);

    if (cached) return cached;

    /**
     * Both ids in a workspace: a bot working there saves to its own folder
     * unless it picks the workspace's, and the chip has to find either.
     */
    const query = new URLSearchParams({ file_id: String(file_id), bot_id: String(bot_id) });

    if (workspace_id) query.set("workspace_id", String(workspace_id));

    const pending = fetchApi<{}, APIResponseObject<BotFileScopesPayload>>(
        `/api/admin/bots/files?${query.toString()}`,
        { method: "GET" },
    )
        .then((res) => (res?.success && res.singleRes?.files?.length ? res.singleRes.files[0] : null))
        .catch(() => null)
        .then((file) => file || null);

    fetched.set(file_id, pending);

    return pending;
}

/**
 * The bot and workspace a file chip looks its file up in: the place the
 * message is shown in when one is set (a hook's thread), else the page's
 * own conversation.
 */
export function useBotFilePlace() {
    const { pageProps } = useContext(AppContext);
    const place = useContext(FilePlaceContext);
    const bot_id = place?.bot_id ?? (Number(pageProps?.bot?.id) || 0);
    const workspace_id = place ? place.workspace_id : pageProps?.workspace?.id ? Number(pageProps.workspace.id) : null;

    return { bot_id, workspace_id };
}

/**
 * One bot file by id: the conversation's files come with the page, so most
 * lookups need no request; one that isn't among them (older than the
 * page's first page) is fetched by id. Null for a file the user doesn't
 * reach, or one deleted since.
 */
export default function useBotFile({ file_id }: { file_id: number }): PublicBotFile | null {
    const { pageProps } = useContext(AppContext);
    const known = pageProps?.bot_files?.files?.find((it) => it.id == file_id);
    const [fetched_file, setFetchedFile] = useState<PublicBotFile | null>(null);
    const { bot_id, workspace_id } = useBotFilePlace();

    useEffect(() => {
        if (known || !bot_id) return;

        let live = true;

        fetchBotFile({ file_id, bot_id, workspace_id }).then((file) => {
            if (live) setFetchedFile(file);
        });

        return () => {
            live = false;
        };
    }, [file_id, bot_id, workspace_id, known]);

    return known || fetched_file;
}
