import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import SettingsGroup from "../../(partials)/settings-group";
import StorageQuotaForm from "../(partials)/storage-quota-form";

/**
 * What bots keep on disk: the quota each of their folders gets. Only a
 * crew manager sees it, since it's an install-wide limit.
 */
export default function StorageSection() {
    const { pageProps } = useContext(AppContext);

    if (!canManageCrew({ user_types: pageProps?.user_types })) return null;

    return (
        <SettingsGroup
            title="Bot files Quota"
            description="Bots keep the documents, images and reports they make in folders on the app's data volume, never on a computer. This is how much each folder may hold."
            id="storage"
        >
            <StorageQuotaForm storage={pageProps?.storage_quota} />
        </SettingsGroup>
    );
}
