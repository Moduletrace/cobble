import { PwaInstallIconSettingKey } from "@/src/data/pwa-data";
import parseInstallIcon from "@/src/utils/parse-install-icon";
import grabAppSetting from "./grab-app-setting";

/**
 * The install's own icon (Settings > General), else the stock ember one.
 */
export default async function grabInstallIcon() {
    return parseInstallIcon({ saved: await grabAppSetting({ key: PwaInstallIconSettingKey }) });
}
