import { randomInt } from "node:crypto";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_BSQLITE_USERS, BunSQLiteTables } from "@/db/types/db";
import AppError from "@/src/utils/app-error";

type Params = {
    email: string;
};

/**
 * Derives a free username from an email's local part, adding a numeric
 * suffix when the plain version is taken.
 */
export default async function generateUniqueUsername({ email }: Params) {
    const base = (email.split("@")[0] || "user")
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "")
        .slice(0, 24)
        .padEnd(3, "0");

    for (let attempt = 0; attempt < 6; attempt++) {
        const candidate =
            attempt == 0 ? base : `${base}${randomInt(1000, 100000)}`;

        const existing = (
            await BunSQLite.select<
                BUN_SQLITE_BSQLITE_USERS,
                (typeof BunSQLiteTables)[number]
            >({
                table: "users",
                query: {
                    query: {
                        username: {
                            value: candidate,
                        },
                    },
                },
            })
        )?.singleRes;

        if (!existing?.id) {
            return candidate;
        }
    }

    throw new AppError(`Couldn't pick a username. Please sign up with the form.`);
}
