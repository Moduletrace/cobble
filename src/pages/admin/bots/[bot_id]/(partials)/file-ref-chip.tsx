import { useContext } from "react";
import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import { AppContext } from "@/src/pages/__root";
import type { MediaType } from "@/src/types";
import AttachmentIcon from "./attachment-icon";

type Props = {
    file_id: number;
};

/**
 * A file a bot named in a message (`fileRef`): the name it is saved under,
 * linked to its bytes. The conversation's files come with the page, so no
 * request is made per chip; a file the user doesn't reach (or one deleted
 * since) shows as its id.
 */
export default function FileRefChip({ file_id }: Props) {
    const { pageProps } = useContext(AppContext);
    const file = pageProps?.bot_files?.files?.find((it) => it.id == file_id);

    if (!file) {
        return <Span className="font-bold">{`file ${file_id}`}</Span>;
    }

    return (
        <Link
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open ${file.name}`}
            className="inline-flex h-6 max-w-full gap-1.5 items-center px-1.5 align-middle rounded-default-xs border-0 bg-sunken text-[13px] font-bold leading-4 text-ink hover:opacity-80"
        >
            <AttachmentIcon media_type={file.media_type as MediaType} />
            <Span className="truncate">{file.name}</Span>
        </Link>
    );
}
