import { useState } from "react";
import { Square } from "lucide-react";
import HeaderIconButton from "@/src/components/general/header-icon-button";
import stopChatroomRequest from "../(functions)/stop-chatroom-request";

type Props = {
    chatroom_id: number;
};

/**
 * Stops an open room after a confirm: everything in it that could still
 * run is cancelled and the bot that asked is told.
 */
export default function ChatroomStopButton({ chatroom_id }: Props) {
    const [loading, setLoading] = useState(false);

    const stop = async () => {
        if (!window.confirm(`Stop this request? The bot that asked is told it was stopped.`)) return;

        setLoading(true);
        const res = await stopChatroomRequest({ chatroom_id }).catch(() => null);
        setLoading(false);

        if (!res?.success) window.alert(res?.msg || `Couldn't stop it.`);
    };

    return <HeaderIconButton icon={Square} title="Stop this request" loading={loading} onClick={stop} />;
}
