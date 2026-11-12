import { AppData } from "@/src/data/app-data";
import { ComputerWorkspaceQuotaSettingKey } from "@/src/dict/computer-dict";
import grabAppSetting from "../app-settings/grab-app-setting";

/**
 * The MB a saved setting means. Never saved, or saved as something that
 * isn't a number, is the code's default; a saved `0` is the install saying
 * it sets no limit, which is why the two can't be read alike.
 */
export function computerWorkspaceQuotaMb({ saved }: { saved?: string | null }) {
    if (saved == undefined || String(saved).trim() == "") return AppData.ComputerWorkspaceQuotaMb;

    const mb = Number(saved);

    if (!Number.isFinite(mb)) return AppData.ComputerWorkspaceQuotaMb;

    return Math.max(0, mb);
}

/**
 * The most a computer's workspace may hold, from the General settings
 * (`computer_workspace_quota_mb`), else `AppData.ComputerWorkspaceQuotaMb`.
 * 0 means the install sets no limit.
 */
export default async function grabComputerWorkspaceQuotaBytes() {
    const saved = await grabAppSetting({ key: ComputerWorkspaceQuotaSettingKey });

    return Math.round(computerWorkspaceQuotaMb({ saved }) * 1024 * 1024);
}

/**
 * The same limit in MB, for the settings page.
 */
export async function grabComputerWorkspaceQuotaMb() {
    return computerWorkspaceQuotaMb({ saved: await grabAppSetting({ key: ComputerWorkspaceQuotaSettingKey }) });
}