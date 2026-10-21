import { BotFileQuotaSettingKey } from "@/src/dict/bot-file-dict";
import { grabBotFileQuotaMb } from "../bot-files/grab-bot-file-quota-bytes";
import { grabStorageUsageByOwner, grabTotalStorageUsage } from "../bot-files/grab-storage-usage";

/**
 * The General settings' bot file storage: the quota each folder gets, and
 * what is used right now.
 */
export default async function grabStorageQuotaOverview() {
    const [quota_mb, total, by_owner] = await Promise.all([
        grabBotFileQuotaMb(),
        grabTotalStorageUsage(),
        grabStorageUsageByOwner(),
    ]);

    return {
        setting_key: BotFileQuotaSettingKey,
        quota_mb,
        total_bytes: total.bytes,
        total_files: total.files,
        folders: by_owner.length,
    };
}

export type StorageQuotaOverview = Awaited<ReturnType<typeof grabStorageQuotaOverview>>;
