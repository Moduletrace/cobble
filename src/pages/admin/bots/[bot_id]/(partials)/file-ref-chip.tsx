import { useContext, useEffect, useState } from "react";
import Span from "@moduletrace/twui/layout/Span";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { AppContext } from "@/src/pages/__root";
import type { BotFileScopesPayload, MediaType, PublicBotFile } from "@/src/types";
import FilePreviewLink from "@/src/components/general/file-preview-link";
import AttachmentIcon from "./attachment-icon";

type Props = {
    file_id: number;
};

/**
 * One file, fetched once per id: a message can name a file older than the
 * page's first page of them, and the chip still has to open it. Failures
 * are remembered too, so a deleted file doesn't refetch on every render.
 */
const fetched = new Map<number, Promise<PublicBotFile | null>>();

function fetchFile({
    file_id,
    bot_id,
    workspace_id,
}: Props & { bot_id: number; workspace_id?: number | null }) {
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
 * A file a bot named in a message (`fileRef`): the name it is saved under,
 * opening it in the file preview (its bytes at `/media/<id>`, private: only
 * someone who reaches the file's folder can load them). A folder the bot named is a `folderRef`
 * instead, and its chip opens the files browser. The conversation's files come with the page, so most
 * chips need no request; one that isn't among them (older than the page's
 * first page) is fetched by id. A file the user doesn't reach, or one
 * deleted since, shows as its id.
 */
export default function FileRefChip({ file_id }: Props) {
    const { pageProps } = useContext(AppContext);
    const known = pageProps?.bot_files?.files?.find((it) => it.id == file_id);
    const [fetched_file, setFetchedFile] = useState<PublicBotFile | null>(null);
    const bot_id = Number(pageProps?.bot?.id) || 0;
    const workspace_id = pageProps?.workspace?.id ? Number(pageProps.workspace.id) : null;

    useEffect(() => {
        if (known || !bot_id) return;

        let live = true;

        fetchFile({ file_id, bot_id, workspace_id }).then((file) => {
            if (live) setFetchedFile(file);
        });

        return () => {
            live = false;
        };
    }, [file_id, bot_id, workspace_id, known]);

    const file = known || fetched_file;

    if (!file) {
        return <Span className="font-bold">{`file ${file_id}`}</Span>;
    }

    return (
        <FilePreviewLink
            name={file.name}
            url={file.url}
            media_type={file.media_type}
            size={file.size}
            className="inline-flex h-6 max-w-full gap-1.5 items-center px-1.5 align-middle rounded-default-xs border-0 bg-sunken text-[13px] font-bold leading-4 text-ink hover:opacity-80"
        >
            <AttachmentIcon media_type={file.media_type as MediaType} />
            <Span className="truncate">{file.name}</Span>
        </FilePreviewLink>
    );
}
