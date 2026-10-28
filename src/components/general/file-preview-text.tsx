import Loading from "@moduletrace/twui/elements/Loading";
import Stack from "@moduletrace/twui/layout/Stack";
import useFileText from "@/src/hooks/use-file-text";
import formatBytes from "@/src/utils/format-bytes";
import { AppData } from "@/src/data/app-data";
import type { FilePreviewKind } from "@/src/utils/file-preview-kind";
import FilePreviewCode from "./file-preview-code";
import FilePreviewMarkdown from "./file-preview-markdown";
import FilePreviewNotice from "./file-preview-notice";
import FilePreviewTable from "./file-preview-table";

type Props = {
    kind: FilePreviewKind;
    url: string;
    size?: number;
};

/**
 * A text file read into the preview: markdown rendered, CSV or TSV as a
 * table, anything else as code.
 */
export default function FilePreviewText({ kind, url, size }: Props) {
    const { text, loading, error, too_large } = useFileText({ url, size });

    if (loading) {
        return (
            <Stack className="grow w-full items-center justify-center">
                <Loading />
            </Stack>
        );
    }

    if (too_large) {
        return (
            <FilePreviewNotice
                message={`This file is bigger than ${formatBytes({ bytes: AppData.FilePreviewMaxTextBytes })}, too big to preview. Download it to open it.`}
            />
        );
    }

    if (error || text == null) {
        return <FilePreviewNotice message={error || "The file couldn't be read."} />;
    }

    if (kind == "markdown") return <FilePreviewMarkdown text={text} />;
    if (kind == "csv") return <FilePreviewTable text={text} delimiter="," />;
    if (kind == "tsv") return <FilePreviewTable text={text} delimiter={"\t"} />;

    return <FilePreviewCode text={text} />;
}
