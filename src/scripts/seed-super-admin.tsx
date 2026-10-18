import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_BSQLITE_USER_TYPES,
    BUN_SQLITE_BSQLITE_USERS,
    BunSQLiteTables,
} from "@/db/types/db";

const FIRST_NAME = process.env.SEED_SUPER_ADMIN_FIRST_NAME || "Super";
const LAST_NAME = process.env.SEED_SUPER_ADMIN_LAST_NAME || "Admin";
const EMAIL =
    process.env.SEED_SUPER_ADMIN_EMAIL || "super.admin@example.com";
const USERNAME =
    process.env.SEED_SUPER_ADMIN_USERNAME || "super_admin";

async function seedSuperAdmin() {
    const existing = (
        await BunSQLite.select<
            BUN_SQLITE_BSQLITE_USERS,
            (typeof BunSQLiteTables)[number]
        >({
            table: "users",
            query: {
                query: {
                    email: { value: EMAIL },
                },
            },
        })
    ).singleRes;

    let user_id: number | string;

    if (existing?.id) {
        user_id = existing.id;
        console.log(`User #${user_id} [${EMAIL}] already exists.`);
    } else {
        const insert_res = await BunSQLite.insert<
            BUN_SQLITE_BSQLITE_USERS,
            (typeof BunSQLiteTables)[number]
        >({
            table: "users",
            data: [
                {
                    first_name: FIRST_NAME,
                    last_name: LAST_NAME,
                    email: EMAIL,
                    username: USERNAME,
                    archived: 0,
                },
            ],
            update_on_duplicate: true,
        });

        if (!insert_res.success) {
            console.error(`Failed to create user: ${insert_res.msg}`);
            process.exit(1);
        }

        user_id =
            insert_res.postInsertReturn?.insertId ||
            insert_res.singleRes?.id ||
            "";

        console.log(
            `Created user #${user_id} [${FIRST_NAME} ${LAST_NAME}] <${EMAIL}>.`,
        );
    }

    const has_super_admin = (
        await BunSQLite.select<
            BUN_SQLITE_BSQLITE_USER_TYPES,
            (typeof BunSQLiteTables)[number]
        >({
            table: "user_types",
            query: {
                query: {
                    user_id: { value: user_id },
                    user_type: { value: "super_admin" },
                },
            },
        })
    ).payload?.[0];

    if (has_super_admin) {
        console.log(`User #${user_id} already has the super_admin type.`);
        return;
    }

    const type_res = await BunSQLite.insert<
        BUN_SQLITE_BSQLITE_USER_TYPES,
        (typeof BunSQLiteTables)[number]
    >({
        table: "user_types",
        data: [
            {
                user_id: Number(user_id),
                user_type: "super_admin",
            },
        ],
    });

    if (!type_res.success) {
        console.error(`Failed to assign super_admin type: ${type_res.msg}`);
        process.exit(1);
    }

    console.log(`Assigned super_admin type to user #${user_id}.`);
}

await seedSuperAdmin();

console.log(
    `Seed complete. Log in via SSO code sent to ${EMAIL} at /auth/login.`,
);
process.exit(0);