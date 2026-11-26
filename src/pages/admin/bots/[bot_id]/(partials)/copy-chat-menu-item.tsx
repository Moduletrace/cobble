import { useEffect, useRef, useState } from "react";
import { Check, ClipboardCopy } from "lucide-react";
import { AppData } from "@/src/data/app-data";
import copyConversation from "../(functions)/copy-conversation";
import HeaderMenuItem from "./header-menu-item";

type Props = {
    bot_id: number;
    workspace_id?: number | null;
    /**
     * Closes the menu once the copy is confirmed.
     */
    on_open?: () => void;
};

/**
 * The header menu's "Copy chat": puts the session on screen on the
 * clipboard as one markdown document (`copyConversation`). The row shows a
 * check for a moment, then the menu closes.
 */
export default function CopyChatMenuItem({ bot_id, workspace_id, on_open }: Props) {
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

        const failure = await copyConversation({ bot_id, workspace_id });

        setLoading(false);

        if (failure) {
            window.alert(failure);
            return;
        }

        setCopied(true);
        timeout.current = setTimeout(() => {
            setCopied(false);
            on_open?.();
        }, AppData.CopyConfirmationMs);
    };

    return (
        <HeaderMenuItem
            icon={copied ? Check : ClipboardCopy}
            title={copied ? "Copied" : "Copy chat"}
            description="Copy this session as markdown"
            loading={loading}
            disabled={loading}
            onClick={() => {
                if (!copied) void copy();
            }}
        />
    );
}
