import BunSQLite from "@moduletrace/bun-sqlite";
import type { SaveConnectorAccountAccessRequest } from "@/src/schemas/connector-schema";
import assertSuperAdmin from "../access/assert-super-admin";
import grabCrewRole from "../access/grab-crew-role";
import grabUserBot from "../bots/grab-user-bot";
import grabUserWorkspace from "../workspaces/grab-user-workspace";
import attachConnectorAccountScopes from "./attach-connector-account-scopes";
import grabConnector from "./grab-connector";
import grabConnectorAccount from "./grab-connector-account";
import syncConnector from "./sync-connector";

type Params = {
    user_id: number | string;
    data: SaveConnectorAccountAccessRequest;
};

/**
 * Where one sign-in may be used: its owner's runs always, and every run in
 * these workspaces or on these bots, or everywhere. The owner sets it, and
 * a super admin may set it on anyone's account. A member can only give an
 * account to places they reach themselves.
 */
export default async function setConnectorAccountAccess({ user_id, data }: Params) {
    const account = await grabConnectorAccount({ account_id: data.account_id, user_id: Number(user_id), any_owner: true });
    const role = await grabCrewRole({ user_id });

    if (role != "super_admin" && account.user_id != Number(user_id)) {
        throw new Error(`Only the account's owner or a super admin can change where it is used.`);
    }

    const workspace_ids = [...new Set(data.workspace_ids.map((id) => Number(id)))];
    const bot_ids = [...new Set(data.bot_ids.map((id) => Number(id)))];

    if (role != "super_admin") {
        for (const workspace_id of workspace_ids) {
            await grabUserWorkspace({ user_id, workspace_id });
        }

        for (const bot_id of bot_ids) {
            await grabUserBot({ user_id, bot_id });
        }
    }

    const now = Date.now();
    await BunSQLite.sql({
        sql: `DELETE FROM connector_account_workspaces WHERE account_id = ?`,
        values: [account.id],
    });
    await BunSQLite.sql({ sql: `DELETE FROM connector_account_bots WHERE account_id = ?`, values: [account.id] });

    for (const workspace_id of workspace_ids) {
        await BunSQLite.sql({
            sql: `INSERT OR IGNORE INTO connector_account_workspaces (created_at, updated_at, account_id, workspace_id)
                SELECT ?, ?, ?, id FROM workspaces WHERE id = ?`,
            values: [now, now, account.id, workspace_id],
        });
    }

    for (const bot_id of bot_ids) {
        await BunSQLite.sql({
            sql: `INSERT OR IGNORE INTO connector_account_bots (created_at, updated_at, account_id, bot_id)
                SELECT ?, ?, ?, id FROM bots WHERE id = ?`,
            values: [now, now, account.id, bot_id],
        });
    }

    await BunSQLite.sql({
        sql: `UPDATE connector_accounts SET all_bots = ?, updated_at = ? WHERE id = ?`,
        values: [data.all_bots ? 1 : 0, now, account.id],
    });

    const connector = await grabConnector({ connector_id: account.connector_id });

    if (!connector.tools.length) {
        await syncConnector({ connector_id: account.connector_id });
    }

    const updated = await grabConnectorAccount({ account_id: account.id, user_id: account.user_id });
    const scopes = await attachConnectorAccountScopes({ account_ids: [account.id] });

    return {
        ...updated,
        workspace_ids: scopes.get(account.id)?.workspace_ids || [],
        bot_ids: scopes.get(account.id)?.bot_ids || [],
    };
}