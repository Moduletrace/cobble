import BotSettingsSection from "./(sections)/bot-settings-section";
import settingsRecordPageMeta from "../../(functions)/settings-record-page-meta";

export default function AdminSettingsBotPage() {
    return <BotSettingsSection />;
}

export const meta = settingsRecordPageMeta({ kind: "bots" });
