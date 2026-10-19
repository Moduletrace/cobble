import WorkspaceOverview from "./(sections)/workspace-overview";
import settingsRecordPageMeta from "../../(functions)/settings-record-page-meta";

export default function AdminSettingsWorkspacePage() {
    return <WorkspaceOverview />;
}

export const meta = settingsRecordPageMeta({ kind: "workspaces" });
