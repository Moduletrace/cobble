import UserSettingsSection from "./(sections)/user-settings-section";
import settingsRecordPageMeta from "../../(functions)/settings-record-page-meta";

export default function AdminSettingsUserPage() {
    return <UserSettingsSection />;
}

export const meta = settingsRecordPageMeta({ kind: "users" });
