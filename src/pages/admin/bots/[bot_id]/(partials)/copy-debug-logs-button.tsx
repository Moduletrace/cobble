import { useEffect, useRef, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import { Check, ClipboardCopy } from "lucide-react";
import { AppData } from "@/src/data/app-data";
import copyPendingText from "@/src/utils/copy-pending-text";
import type { BotTraceJob } from "@/src/types";
import messageDebugLogsMarkdown from "../(utils)/message-debug-logs-markdown";

type Props = {
    message_id: number;
    /**
     * The runs behind the message, as the tab already read them.
     */
    jobs: BotTraceJob[];
};

/**
 * The debug logs tab's "Copy debug logs": puts the message's whole trace on
 * the clipboard as one markdown document (`messageDebugLogsMarkdown`),
 * every step it kept included. The row shows a check for a moment, then
 * goes back.
 */
export default function CopyDebugLogsButton({ message_id, jobs }: Props) {
    const [copied, set_copied] = useState(false);
    const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timeout.current) clearTimeout(timeout.current);
        };
    }, []);

    const copy = async () => {
        const text = Promise.resolve(messageDebugLogsMarkdown({ message_id, jobs, now: Date.now() }));

        try {
            const worked = await copyPendingText({ text });

            if (!worked) {
                window.alert("Couldn't copy the debug logs to the clipboard.");
                return;
            }

            set_copied(true);
            timeout.current = setTimeout(() => set_copied(false), AppData.CopyConfirmationMs);
        } catch {
            window.alert("Couldn't copy the debug logs.");
        }
    };

    return (
        <Button
            title={copied ? "Copied" : "Copy this message's debug logs as markdown"}
            type="button"
            variant="ghost"
            color="gray"
            size="small"
            beforeIcon={copied ? <Check size={14} aria-hidden /> : <ClipboardCopy size={14} aria-hidden />}
            disabled={copied}
            onClick={() => {
                if (!copied) void copy();
            }}
            className="shrink-0 px-2! text-[12px]"
        >
            {copied ? "Copied" : "Copy debug logs"}
        </Button>
    );
}