import { ComputerWorkspaceQuotaSettingKey } from "@/src/dict/computer-dict";
import { grabComputerWorkspaceQuotaMb } from "./grab-computer-workspace-quota-bytes";

/**
 * The General settings' computer workspace limit: how much one computer's
 * workspace may hold. Only the limit, not what each computer holds now: a
 * live size is one request per computer, so the computers' own pages show
 * theirs instead.
 */
export default async function grabComputerWorkspaceQuotaOverview() {
    return {
        setting_key: ComputerWorkspaceQuotaSettingKey,
        quota_mb: await grabComputerWorkspaceQuotaMb(),
    };
}

export type ComputerWorkspaceQuotaOverview = Awaited<
    ReturnType<typeof grabComputerWorkspaceQuotaOverview>
>;