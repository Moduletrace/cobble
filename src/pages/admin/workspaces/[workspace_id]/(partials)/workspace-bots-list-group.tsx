import SettingsGroup from "@/src/pages/admin/settings/(partials)/settings-group";
import SettingsList from "@/src/pages/admin/settings/(partials)/settings-list";
import type { WorkspaceBot } from "@/src/types";
import WorkspaceDashboardBotRow from "./workspace-dashboard-bot-row";

type Props = {
    workspace_id: number;
    /**
     * The workspace's crew, the coordinator among them.
     */
    bots: WorkspaceBot[];
};

/**
 * Who works here, each opening its conversation in the workspace. Display
 * only: bots are added and taken out under Settings.
 */
export default function WorkspaceBotsListGroup({ workspace_id, bots }: Props) {
    return (
        <SettingsGroup
            id="bots"
            title="Bots"
            description="Everyone working here. The coordinator is in every workspace."
        >
            <SettingsList
                is_empty={!bots.length}
                empty="No bots here yet. Add some under Settings."
            >
                {bots.map((bot) => (
                    <WorkspaceDashboardBotRow
                        key={bot.id}
                        workspace_id={workspace_id}
                        bot={bot}
                    />
                ))}
            </SettingsList>
        </SettingsGroup>
    );
}
