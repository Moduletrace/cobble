import ChatroomStones from "@/src/components/general/chatroom-stones";
import SettingsListRow from "@/src/pages/admin/settings/(partials)/settings-list-row";
import type { ChatroomSummary } from "@/src/types";
import chatroomStatusLine from "@/src/utils/chatroom-status-line";
import relativeTime from "@/src/utils/relative-time";
import chatroomHref from "@/src/utils/chatroom-href";

type Props = {
    chatroom: ChatroomSummary;
    /**
     * Name the workspace it's in (left out inside that workspace).
     */
    show_workspace?: boolean;
};

/**
 * A chatroom in the list: the bots in it, the request, where it stands,
 * the workspace it's in and when it last moved.
 */
export default function ChatroomListRow({ chatroom, show_workspace }: Props) {
    const at = Number(chatroom.last_activity_at || chatroom.created_at || 0);

    return (
        <SettingsListRow
            avatar={<ChatroomStones bots={chatroom.bots} size={18} className="w-20" />}
            title={chatroom.title || "A request"}
            href={chatroomHref({ chatroom })}
            badge={chatroom.unread ? "New" : undefined}
            subtitle={[chatroomStatusLine(chatroom), show_workspace && chatroom.workspace_name, at ? relativeTime({ at }) : ""]
                .filter(Boolean)
                .join(" · ")}
        />
    );
}
