import { useEffect, useRef, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import { Check, ClipboardCopy } from "lucide-react";
import { AppData } from "@/src/data/app-data";
import copyPendingText from "@/src/utils/copy-pending-text";
import messageDetailsMarkdown from "../(utils)/message-details-markdown";
import fetchMessageDetails from "../(functions)/fetch-message-details";

type Props = {
    message_id: number;
};

/**
 * The details modal's "Copy report": puts the message's whole details on
 * the clipboard as one markdown document (`messageDetailsMarkdown`),
 * every call and failure it took included, not only the ones the modal
 * lists. The row shows a check for a moment, then goes back.
 */
export default function CopyMessageDetailsButton({ message_id }: Props) {
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timeout.current) clearTimeout(timeout.current);
        };
    }, []);

    const copy = async () => {
        setLoading(true);

        const markdown = fetchMessageDetails({ message_id, full: true }).then((res) => {
            if (!res?.success || !res.singleRes) {
                throw new Error(res?.msg || "Couldn't load this message's details.");
            }

            return messageDetailsMarkdown({ details: res.singleRes, now: Date.now() });
        });

        try {
            const worked = await copyPendingText({ text: markdown });

            setLoading(false);

            if (!worked) {
                window.alert("Couldn't copy the report to the clipboard.");
                return;
            }

            setCopied(true);
            timeout.current = setTimeout(() => setCopied(false), AppData.CopyConfirmationMs);
        } catch (error: unknown) {
            setLoading(false);
            window.alert(error instanceof Error ? error.message : "Couldn't copy the report.");
        }
    };

    return (
        <Button
            title={copied ? "Copied" : "Copy this message's whole details as markdown"}
            type="button"
            variant="ghost"
            color="gray"
            size="small"
            beforeIcon={copied ? <Check size={14} aria-hidden /> : <ClipboardCopy size={14} aria-hidden />}
            loading={loading}
            disabled={loading}
            onClick={() => {
                if (!copied) void copy();
            }}
            className="shrink-0 px-2! text-[12px]"
        >
            {copied ? "Copied" : "Copy report"}
        </Button>
    );
}
