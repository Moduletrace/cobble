import UploadRestoreSection from "./(sections)/upload-restore-section";
import BackupsListSection from "../(sections)/backups-list-section";
import SettingsShell from "../../(partials)/settings-shell";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";

export default function AdminSettingsRestoreBackupPage() {
    return (
        <SettingsShell
            title="Restore backup"
            description="Replace all current data with a saved or uploaded backup."
            breadcrumb_title="Restore backup"
            wide
        >
            <UploadRestoreSection />
            <BackupsListSection mode="restore" />
        </SettingsShell>
    );
}

export const meta: BunextPageModuleMetaFn = async () => {
    return {
        title: `Restore backup | ${SiteData["SiteName"]}`,
        description: `Restore a database backup on ${SiteData["SiteName"]}.`,
    };
};
