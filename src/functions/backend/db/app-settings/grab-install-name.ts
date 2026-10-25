import { PwaInstallNameSettingKey } from "@/src/data/pwa-data";
import grabAppSetting from "./grab-app-setting";

/**
 * The name this install was given in Settings > General, or empty when it
 * was never named (`installDisplayName` falls back to `SiteName`).
 */
export default async function grabInstallName() {
    const saved = await grabAppSetting({ key: PwaInstallNameSettingKey });

    return saved?.trim() || "";
}
