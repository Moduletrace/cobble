import { useEffect, useState } from "react";
import Loading from "@moduletrace/twui/elements/Loading";
import Modal from "@moduletrace/twui/elements/Modal";
import Button from "@moduletrace/twui/layout/Button";
import H2 from "@moduletrace/twui/layout/H2";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { FileText } from "lucide-react";
import FilePreviewCode from "@/src/components/general/file-preview-code";
import FilePreviewMarkdown from "@/src/components/general/file-preview-markdown";
import FilePreviewModal from "@/src/components/general/file-preview-modal";
import TopModalEscape from "@/src/components/general/top-modal-escape";
import { AppData } from "@/src/data/app-data";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { KnowledgebaseDocument } from "@/src/types";
import SettingsStatus from "../../(partials)/settings-status";

type Props = {
    document: KnowledgebaseDocument;
    onClose: () => void;
};

/**
 * One document over its list, read-only: the text bots search, written in
 * or read from its file (markdown rendered, extracted text as it is), with
 * the original a click away.
 */
export default function KnowledgebaseDocumentView({ document, onClose }: Props) {
    const [text, set_text] = useState<{ content: string; truncated: boolean }>();
    const [error, set_error] = useState<string>();
    const [original, set_original] = useState(false);

    useEffect(() => {
        let live = true;

        postAdminApi<{ content: string; truncated: boolean }>({
            path: "knowledgebases/document-text",
            body: { document_id: document.id },
        }).then((res) => {
            if (!live) return;

            if (res.success && res.singleRes) set_text({ content: res.singleRes.content, truncated: res.singleRes.truncated });
            else set_error(res.msg || "Couldn't open the document.");
        });

        return () => {
            live = false;
        };
    }, [document.id]);

    return (
        <>
            <Modal
                open
                setOpen={(next) => {
                    if (!next) onClose();
                }}
                className="max-w-[860px]! w-[95vw] h-[85vh] p-0 bg-paper flex flex-col overflow-hidden"
            >
                <TopModalEscape onClose={onClose} />
                <Stack className="w-full min-w-0 gap-1! items-stretch pl-5 pr-14 py-3 border-0 border-b border-solid border-hairline">
                    <Row className="w-full gap-3! flex-wrap sm:flex-nowrap items-center">
                        <Stack className="grow min-w-0 gap-0! items-stretch">
                            <H2
                                title={document.name}
                                className="text-base! leading-6! tracking-normal! font-bold text-ink truncate min-w-0"
                            >
                                {document.name}
                            </H2>
                            {text?.truncated ? (
                                <Span className="text-xs leading-4 text-ink-secondary">
                                    Showing its first {AppData.KnowledgebaseTextMaxChars.toLocaleString()} characters. Open
                                    the original to read the rest.
                                </Span>
                            ) : null}
                        </Stack>
                        {document.media_id ? (
                            <Button
                                title={`Open the original of ${document.name}`}
                                type="button"
                                variant="ghost"
                                color="gray"
                                size="small"
                                onClick={() => set_original(true)}
                                beforeIcon={<FileText size={16} aria-hidden />}
                                className="shrink-0 gap-1!"
                            >
                                Open original
                            </Button>
                        ) : null}
                    </Row>
                </Stack>
                {error ? (
                    <Stack className="w-full p-5 items-start">
                        <SettingsStatus status={{ error: true, msg: error }} />
                    </Stack>
                ) : !text ? (
                    <Stack className="w-full grow items-center justify-center">
                        <Loading />
                    </Stack>
                ) : !text.content.trim() ? (
                    <Stack className="w-full p-5 items-start">
                        <Span className="text-[13px] leading-[18px] text-ink-secondary">
                            {document.source == "text"
                                ? "This document has no text yet."
                                : "No text could be read from its file. Open the original to read it."}
                        </Span>
                    </Stack>
                ) : document.source == "text" ? (
                    <FilePreviewMarkdown text={text.content} />
                ) : (
                    <FilePreviewCode text={text.content} />
                )}
            </Modal>
            {original && document.media_id ? (
                <FilePreviewModal
                    name={document.name}
                    url={`/media/${document.media_id}`}
                    media_type="document"
                    size={document.size}
                    onClose={() => set_original(false)}
                />
            ) : null}
        </>
    );
}