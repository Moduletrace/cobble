import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { AppData } from "@/src/data/app-data";
import copyText from "@/src/utils/copy-text";
import MessageActionButton from "./message-action-button";

type Props = {
    text: string;
};

/**
 * Copies a message's text as it is stored (markdown and all) and swaps
 * its icon for a check for a moment, so it says it worked without a
 * notification. Renders nothing for a message with no text.
 */
export default function CopyMessageButton({ text }: Props) {
    const [copied, setCopied] = useState(false);
    const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timeout.current) clearTimeout(timeout.current);
        };
    }, []);

    if (!text.trim()) return null;

    const onCopy = async () => {
        const worked = await copyText({ text });

        if (!worked) return;

        if (timeout.current) clearTimeout(timeout.current);

        setCopied(true);
        timeout.current = setTimeout(
            () => setCopied(false),
            AppData.CopyConfirmationMs,
        );
    };

    return (
        <MessageActionButton
            title={copied ? "Copied" : "Copy"}
            aria_label={copied ? "Copied to the clipboard" : "Copy this message"}
            onClick={() => void onCopy()}
        >
            {copied ? (
                <Check size={14} aria-hidden />
            ) : (
                <Copy size={14} aria-hidden />
            )}
        </MessageActionButton>
    );
}
