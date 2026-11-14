import BunSQLite from "@moduletrace/bun-sqlite";
import { grabAskKeepDays, grabAskMaxPerPlace } from "../app-settings/grab-ask-retention";
import deleteAskRows from "./delete-ask-rows";
import pruneAsksSql from "./prune-asks-sql";

type Params = {
    /**
     * One place's requests only (its workspace), or every place when left out.
     */
    workspace_id?: number | string | null;
};

/**
 * Deletes ended requests past the retention window, and the oldest ones past
 * the number one place keeps. A request still pending or working, or one an
 * open request was asked from, is never deleted.
 */
export default async function pruneAsks({ workspace_id }: Params = {}) {
    const query = pruneAsksSql({
        cutoff: Date.now() - (await grabAskKeepDays()) * 86_400_000,
        max_per_place: await grabAskMaxPerPlace(),
        workspace_id,
    });

    const res = await BunSQLite.sql<{ id: number }>(query);
    const asks = res.payload || [];

    if (!asks.length) return 0;

    await deleteAskRows({ asks });

    return asks.length;
}
