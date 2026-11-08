import { Database } from "bun:sqlite";
import AppError from "@/src/utils/app-error";
import { SiteData } from "@/src/data/site-data";

type Params = {
    db_path: string;
};

/**
 * Refuses a database file that holds no accounts: restoring it would
 * only send the install back to first-run setup. Opened read-only, so
 * the file is never changed by the look.
 */
export default function assertDbHasUsers({ db_path }: Params) {
    let db: Database | undefined;

    try {
        db = new Database(db_path, { readonly: true });

        const row = db
            .query<{ id: number }, []>(`SELECT id FROM users LIMIT 1`)
            .get();

        if (!row?.id) {
            throw new AppError(
                `That database has no accounts, so there is nothing to sign in with`,
            );
        }
    } catch (error: unknown) {
        if (error instanceof AppError) throw error;

        throw new AppError(
            `That file isn't a ${SiteData["SiteName"]} database (it has no users table)`,
        );
    } finally {
        db?.close();
    }
}
