import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import SettingsShell from "@/src/pages/admin/settings/(partials)/settings-shell";
import FilesPane from "./(sections)/files-pane";

export default function AdminFilesPage() {
    return (
        <SettingsShell
            title="Files"
            description="Every folder a bot, a workspace or a computer keeps, on the app's data volume."
            wide
        >
            <FilesPane />
        </SettingsShell>
    );
}

export const meta: BunextPageModuleMetaFn = async () => {
    return {
        title: `Files | ${SiteData["SiteName"]}`,
        description: "Browse the files your bots, workspaces and computers keep.",
    };
};
