import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import SettingsGroup from "../../(partials)/settings-group";
import ChatroomRetentionForm from "../(partials)/chatroom-retention-form";

/**
 * How long closed chatrooms are kept and how many one place keeps. Only the
 * super admin sees it, since it changes every user's rooms.
 */
export default function ChatroomRetentionSection() {
    const { pageProps } = useContext(AppContext);

    if (!isPassThroughUser({ user_types: pageProps?.user_types })) return null;

    return (
        <SettingsGroup
            title="Chatrooms"
            description="Chatrooms are records of bots asking each other through the coordinator. Closed ones are deleted after a while, and each workspace (and bots' own chats) keeps only so many; open rooms are never deleted. What a room answered stays in the asking bot's conversation."
            id="chatrooms"
        >
            <ChatroomRetentionForm retention={pageProps?.chatroom_retention} />
        </SettingsGroup>
    );
}
