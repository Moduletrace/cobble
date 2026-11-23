import type { ProviderAccountStatus } from "@/src/harness/connectors/connector-provider";

type Params = {
    now: number;
    connector_id: number;
    user_id: number;
    label: string;
    slug: string;
    provider_account_id: string;
    status: ProviderAccountStatus;
};

/**
 * One row per provider account, even when two syncs (a poll beside the cron)
 * reach it at once: the statement itself refuses a second row, so neither can
 * insert the same sign-in twice.
 */
export default function insertConnectorAccountSql({
    now,
    connector_id,
    user_id,
    label,
    slug,
    provider_account_id,
    status,
}: Params) {
    return {
        sql: `INSERT INTO connector_accounts
            (created_at, updated_at, connector_id, user_id, label, slug, provider_account_id, status, is_default, connected_at, last_checked_at, last_error)
            SELECT ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ''
            WHERE NOT EXISTS (
                SELECT 1 FROM connector_accounts WHERE connector_id = ? AND user_id = ? AND provider_account_id = ?
            )`,
        values: [
            now,
            now,
            connector_id,
            user_id,
            label,
            slug,
            provider_account_id,
            status,
            status == "connected" ? now : null,
            now,
            connector_id,
            user_id,
            provider_account_id,
        ],
    };
}