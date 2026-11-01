import BrowserDefaultPicker from "@/src/components/general/browser-default-picker";
import SettingsGroup from "./settings-group";

type Props = {
    id: string;
    bot_id?: number;
    workspace_id?: number;
};

/**
 * The signed-in user's own browser choices for a bot or workspace. Only
 * their own: another user's choices here are theirs to make.
 */
export default function BrowserDefaultGroup({ id, bot_id, workspace_id }: Props) {
    return (
        <SettingsGroup
            title="Your browsers"
            description="Which of your own browsers apply here, for your conversations only."
        >
            <BrowserDefaultPicker id={id} bot_id={bot_id} workspace_id={workspace_id} />
        </SettingsGroup>
    );
}
