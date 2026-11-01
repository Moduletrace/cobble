import { useContext, useState } from "react";
import { RotateCcw } from "lucide-react";
import Button from "@moduletrace/twui/layout/Button";
import HeaderIconButton from "@/src/components/general/header-icon-button";
import retryChatroomRequest from "@/src/functions/frontend/retry-chatroom-request";
import { AppContext } from "@/src/pages/__root";
import type { ChatroomSummary } from "@/src/types";
import canRetryChatroom from "@/src/utils/can-retry-chatroom";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";

type Props = {
    chatroom: Pick<ChatroomSummary, "id" | "status">;
    /**
     * Say it in words, for a button sitting in a message.
     */
    labelled?: boolean;
};

/**
 * Tries a failed or stopped request again after a confirm. Shows nothing
 * for any other room, or for a user who can only read.
 */
export default function ChatroomRetryButton({ chatroom, labelled }: Props) {
    const { pageProps } = useContext(AppContext);
    const [loading, setLoading] = useState(false);

    if (!canRetryChatroom({ chatroom })) return null;
    if (isReadOnlyUser({ user_types: pageProps?.user_types || [] })) return null;

    const retry = async () => {
        if (!window.confirm(`Try this request again? The coordinator picks it up from what was already said.`)) return;

        setLoading(true);
        const res = await retryChatroomRequest({ chatroom_id: Number(chatroom.id) }).catch(() => null);
        setLoading(false);

        if (!res?.success) window.alert(res?.msg || `Couldn't try it again.`);
    };

    if (!labelled) {
        return <HeaderIconButton icon={RotateCcw} title="Try this request again" loading={loading} onClick={retry} />;
    }

    return (
        <Button
            title="Try this request again"
            type="button"
            variant="outlined"
            color="text"
            loading={loading}
            onClick={retry}
            className="h-8! px-3! gap-1.5! text-[13px] font-bold rounded-default"
        >
            <RotateCcw size={14} aria-hidden />
            Try again
        </Button>
    );
}
