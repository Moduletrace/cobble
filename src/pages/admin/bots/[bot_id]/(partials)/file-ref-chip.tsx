import Span from "@moduletrace/twui/layout/Span";
import type { MediaType } from "@/src/types";
import FilePreviewLink from "@/src/components/general/file-preview-link";
import useBotFile from "../(hooks)/use-bot-file";
import AttachmentIcon from "./attachment-icon";

type Props = {
    file_id: number;
};

/**
 * A file a bot named in a message (`fileRef`): the name it is saved under,
 * opening it in the file preview (its bytes at `/media/<id>`, private: only
 * someone who reaches the file's folder can load them). A folder the bot named is a `folderRef`
 * instead, and its chip opens the files browser. A file the user doesn't reach, or one
 * deleted since, shows as its id.
 */
export default function FileRefChip({ file_id }: Props) {
    const file = useBotFile({ file_id });

    if (!file) {
        return <Span className="font-bold">{`file ${file_id}`}</Span>;
    }

    return (
        <FilePreviewLink
            name={file.name}
            url={file.url}
            media_type={file.media_type}
            size={file.size}
            full_path={file.full_path}
            className="inline-flex h-6 max-w-full gap-1.5 items-center px-1.5 align-middle rounded-default-xs border-0 bg-sunken text-[13px] font-bold leading-4 text-ink hover:opacity-80"
        >
            <AttachmentIcon media_type={file.media_type as MediaType} />
            <Span className="truncate">{file.name}</Span>
        </FilePreviewLink>
    );
}
