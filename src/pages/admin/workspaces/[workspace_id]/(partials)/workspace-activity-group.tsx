import SettingsGroup from "@/src/pages/admin/settings/(partials)/settings-group";
import SettingsList from "@/src/pages/admin/settings/(partials)/settings-list";
import type { WorkspaceActivityItem } from "@/src/types";
import WorkspaceActivityRow from "./workspace-activity-row";

type Props = {
    workspace_id: number;
    /**
     * The user's latest sessions in the workspace, most recent first.
     */
    activity: WorkspaceActivityItem[];
};

/**
 * What has happened in the workspace lately: the user's latest
 * conversations, each opening the bot's conversation here.
 */
export default function WorkspaceActivityGroup({ workspace_id, activity }: Props) {
    return (
        <SettingsGroup
            id="activity"
            title="Latest activity"
            description="Your latest conversations with the bots here."
        >
            <SettingsList
                is_empty={!activity.length}
                empty="No conversations here yet. Open a bot below to start one."
            >
                {activity.map((item) => (
                    <WorkspaceActivityRow
                        key={item.id}
                        workspace_id={workspace_id}
                        item={item}
                    />
                ))}
            </SettingsList>
        </SettingsGroup>
    );
}
