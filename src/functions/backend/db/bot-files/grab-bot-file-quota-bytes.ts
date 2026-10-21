import { AppData } from "@/src/data/app-data";
import { BotFileQuotaSettingKey } from "@/src/dict/bot-file-dict";
import grabAppSetting from "../app-settings/grab-app-setting";

/**
 * The storage limit one directory may hold, from the General settings
 * (`bot_files_quota_mb`), else `AppData.BotFileQuotaMb`. A workspace's
 * shared directory gets the same limit as a bot's own.
 */
export default async function grabBotFileQuotaBytes() {
    const saved = Number(await grabAppSetting({ key: BotFileQuotaSettingKey }));
    const mb = Number.isFinite(saved) && saved > 0 ? saved : AppData.BotFileQuotaMb;

    return Math.round(mb * 1024 * 1024);
}

/**
 * The same limit in MB, for the settings page.
 */
export async function grabBotFileQuotaMb() {
    const saved = Number(await grabAppSetting({ key: BotFileQuotaSettingKey }));

    return Number.isFinite(saved) && saved > 0 ? saved : AppData.BotFileQuotaMb;
}
