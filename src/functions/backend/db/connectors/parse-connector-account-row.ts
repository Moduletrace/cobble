import type { BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS } from "@/db/types/db";
import type { ConnectorAccountStatus } from "@/src/dict/connector-dict";
import type { ConnectorAccountRecord } from "@/src/types";

type Params = {
    row: BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS;
    /**
     * Where it has been given to, read beside the row.
     */
    workspace_ids?: number[];
    bot_ids?: number[];
    owner_name?: string;
};

/**
 * A `connector_accounts` row as the app reads it. The account's credential
 * stays at the provider; this is only which of the user's accounts it is.
 */
export default function parseConnectorAccountRow({
    row,
    workspace_ids = [],
    bot_ids = [],
    owner_name = "",
}: Params): ConnectorAccountRecord {
    return {
        id: Number(row.id),
        connector_id: Number(row.connector_id),
        user_id: Number(row.user_id),
        label: row.label || "",
        slug: row.slug || "",
        provider_account_id: row.provider_account_id || "",
        status: (row.status || "pending") as ConnectorAccountStatus,
        is_default: row.is_default == 1,
        all_bots: row.all_bots == 1,
        workspace_ids,
        bot_ids,
        owner_name,
        connected_at: typeof row.connected_at == "number" ? row.connected_at : null,
        last_error: row.last_error || "",
    };
}