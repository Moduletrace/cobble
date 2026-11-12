import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import SettingsGroup from "../../(partials)/settings-group";
import ComputerWorkspaceQuotaForm from "../(partials)/computer-workspace-quota-form";

/**
 * What a computer keeps on its own volume: browsers save screenshots,
 * downloads and whole sites there, so one busy computer fills a small disk
 * on its own. Only a crew manager sees it, since it's an install-wide limit.
 */
export default function ComputerWorkspacesSection() {
    const { pageProps } = useContext(AppContext);

    if (!canManageCrew({ user_types: pageProps?.user_types })) return null;

    return (
        <SettingsGroup
            title="Computer workspace limit"
            description="Browsers and shells on a computer fill its own volume, not the app's: screenshots, downloads and everything a site caches. Each computer's workspace is capped so one can't fill the host it runs on."
            id="computer-workspaces"
        >
            <ComputerWorkspaceQuotaForm quota={pageProps?.computer_workspace_quota} />
        </SettingsGroup>
    );
}