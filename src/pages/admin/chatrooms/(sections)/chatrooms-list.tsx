import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import SettingsGroup from "@/src/pages/admin/settings/(partials)/settings-group";
import SettingsList from "@/src/pages/admin/settings/(partials)/settings-list";
import SettingsShell from "@/src/pages/admin/settings/(partials)/settings-shell";
import useLiveChatrooms from "../(hooks)/use-live-chatrooms";
import ChatroomListRow from "../(partials)/chatroom-list-row";

/**
 * The user's chatrooms (every one, or a workspace's inside it), open ones
 * first. A chatroom is the record of one bot asking another for something
 * through the coordinator.
 */
export default function ChatroomsList() {
    const { pageProps } = useContext(AppContext);
    const workspace = pageProps?.workspace;
    const workspace_id = workspace?.id ? Number(workspace.id) : undefined;
    const chatrooms = useLiveChatrooms({ chatrooms: pageProps?.chatrooms || [], workspace_id });

    return (
        <SettingsShell
            title="Chatrooms"
            description={
                workspace
                    ? `When a bot in ${workspace.name} needs another bot here, it asks the coordinator. Each request is kept here, read-only.`
                    : "When a bot needs another bot, it asks the coordinator. Each request is kept here, read-only."
            }
            no_trail={Boolean(workspace)}
        >
            <SettingsGroup
                title="Requests"
                description="Open ones first. The answer goes back to the bot that asked, which carries on in its own conversation."
            >
                <SettingsList is_empty={!chatrooms.length} empty="No chatrooms yet.">
                    {chatrooms.map((chatroom) => (
                        <ChatroomListRow key={chatroom.id} chatroom={chatroom} show_workspace={!workspace} />
                    ))}
                </SettingsList>
            </SettingsGroup>
        </SettingsShell>
    );
}
