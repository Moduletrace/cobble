import ConnectorAppsSection from "../(sections)/connector-apps-section";
import settingsConnectorPageMeta from "../(functions)/settings-connector-page-meta";

export default function AdminSettingsConnectorPage() {
    return <ConnectorAppsSection />;
}

export const meta = settingsConnectorPageMeta();