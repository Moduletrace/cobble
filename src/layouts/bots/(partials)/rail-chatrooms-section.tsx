import { useContext } from "react";
import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import { Ellipsis } from "lucide-react";
import { AppData } from "@/src/data/app-data";
import { AppContext } from "@/src/pages/__root";
import useRailChatrooms from "../(hooks)/use-rail-chatrooms";
import chatroomHref from "@/src/utils/chatroom-href";
import RailChatroomRow from "./rail-chatroom-row";
import RailSectionLabel from "./rail-section-label";

type Props = {
    /**
     * Inside a workspace, its rooms; left out, those asked from bots' own
     * chats.
     */
    workspace_id?: number | null;
};

/**
 * One place's chatrooms (bots' own chats after the workspaces, or a
 * workspace's after its bots): the latest `AppData.ChatroomRailLimit`
 * (open ones first), then "See all chatrooms" for the page that lists
 * them. Loaded by the rail, not the page.
 */
export default function RailChatroomsSection({ workspace_id = null }: Props) {
    const { pageProps } = useContext(AppContext);
    const chatrooms = useRailChatrooms({ workspace_id });
    const see_all = workspace_id ? `/admin/workspaces/${workspace_id}/chatrooms` : "/admin/chatrooms";
    const selected_id = pageProps?.chatroom?.id;

    if (!chatrooms) return null;

    const shown = chatrooms.slice(0, AppData.ChatroomRailLimit);

    return (
        <>
            <RailSectionLabel title="Chatrooms" />
            {shown.map((chatroom) => (
                <RailChatroomRow
                    key={chatroom.id}
                    chatroom={chatroom}
                    href={chatroomHref({ chatroom })}
                    selected={chatroom.id == selected_id}
                />
            ))}
            {chatrooms.length ? null : (
                <Span className="hidden @rail:block px-3 py-2 text-[13px] leading-[18px] text-ink-secondary">
                    {workspace_id
                        ? "No chatrooms here yet. When a bot here needs another bot here, it asks the coordinator, and the exchange is kept here."
                        : "No chatrooms yet. When a bot needs another bot, it asks the coordinator, and the exchange is kept here."}
                </Span>
            )}
            {chatrooms.length ? (
                <Link
                    href={see_all}
                    title="See all chatrooms"
                    className="flex shrink-0 h-10 w-full items-center justify-center @rail:justify-start gap-3 rounded-default px-1 @rail:px-3 border-0 text-ink-secondary hover:opacity-100 hover:text-ink hover:bg-sunken transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink"
                >
                    <Ellipsis size={18} aria-hidden className="@rail:hidden" />
                    <Span className="hidden @rail:inline text-[13px] font-bold leading-4 truncate">
                        See all chatrooms
                    </Span>
                </Link>
            ) : null}
        </>
    );
}
