import ComputerSettingsSection from "./(sections)/computer-settings-section";
import settingsRecordPageMeta from "../../(functions)/settings-record-page-meta";

export default function AdminSettingsComputerPage() {
    return <ComputerSettingsSection />;
}

export const meta = settingsRecordPageMeta({ kind: "computers" });
