import BunSQLite from "@moduletrace/bun-sqlite";
import type { SaveConnectorAccountRequest } from "@/src/schemas/connector-schema";
import AppError from "@/src/utils/app-error";
import connectorSlug from "@/src/utils/connector-slug";
import grabCrewRole from "../access/grab-crew-role";
import grabConnectorAccount from "./grab-connector-account";

type Params = {
    user_id: number | string;
    data: SaveConnectorAccountRequest;
};

/**
 * Renames one sign-in: what the bot calls it, which is how a person tells
 * their two accounts apart. The owner does it; a super admin may do it on
 * anyone's account.
 */
export default async function saveConnectorAccount({ user_id, data }: Params) {
    const account = await grabConnectorAccount({
        account_id: data.account_id,
        user_id: Number(user_id),
        any_owner: true,
    });
    const role = await grabCrewRole({ user_id });

    if (role != "super_admin" && account.user_id != Number(user_id)) {
        throw new AppError(`Only the account's owner or a super admin can rename it.`);
    }

    const label = data.label.trim().slice(0, 80);
    if (!label) throw new AppError(`Give the account a name, e.g. Work Gmail.`);

    const taken =
        (
            await BunSQLite.sql<{ slug: string }>({
                sql: `SELECT slug FROM connector_accounts WHERE connector_id = ? AND user_id = ? AND id != ?`,
                values: [account.connector_id, account.user_id, account.id],
            })
        ).payload || [];
    const used = new Set(taken.map((row) => row.slug).filter(Boolean));
    const base = connectorSlug({ name: label });
    let slug = base;
    let suffix = 2;

    while (used.has(slug)) {
        slug = `${base.slice(0, 12)}-${suffix}`;
        suffix += 1;
    }

    await BunSQLite.sql({
        sql: `UPDATE connector_accounts SET label = ?, slug = ?, updated_at = ? WHERE id = ?`,
        values: [label, slug, Date.now(), account.id],
    });

    return { ...account, label, slug };
}