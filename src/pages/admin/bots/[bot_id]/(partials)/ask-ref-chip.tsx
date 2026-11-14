import { useEffect, useState } from "react";
import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import { MessageSquareShare } from "lucide-react";
import conversationHref from "@/src/utils/conversation-href";
import type { AskOverview } from "@/src/types";

type Props = {
    ask_id: number;
};

/**
 * A crew request named in a message (`askRef`): a pill that opens the
 * conversation it ran in, in the bot that answered it. Read when it
 * renders, since the chat only carries the id.
 */
export default function AskRefChip({ ask_id }: Props) {
    const [ask, setAsk] = useState<AskOverview | null>(null);
    const label = `ask #${ask_id}`;
    const content = (
        <>
            <MessageSquareShare size={12} aria-hidden />
            <Span className="min-w-0 truncate">{label}</Span>
        </>
    );
    const className =
        "inline-flex h-6 max-w-full gap-1.5 items-center px-1.5 align-middle rounded-default-xs border-0 bg-sunken text-[13px] font-bold leading-4 text-ink whitespace-nowrap";

    useEffect(() => {
        let live = true;

        fetch(`/api/admin/bots/ask?ask_id=${ask_id}`)
            .then((res) => res.json())
            .then((data: { success?: boolean; singleRes?: AskOverview }) => {
                if (live && data?.success && data.singleRes) setAsk(data.singleRes);
            })
            .catch(() => {});

        return () => {
            live = false;
        };
    }, [ask_id]);

    if (!ask?.target_bot_id || !ask.session_id) {
        return (
            <Span className={className} title={ask?.status ? `Request ${ask.status}` : undefined}>
                {content}
            </Span>
        );
    }

    return (
        <Link
            href={conversationHref({
                bot_id: ask.target_bot_id,
                workspace_id: ask.workspace_id,
                session_id: ask.session_id,
            })}
            title={`Open ${ask.title || "the request"} in ${ask.target_name || "the bot that answered it"}`}
            className={`${className} hover:opacity-80`}
        >
            {content}
        </Link>
    );
}
