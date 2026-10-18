import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_USER_TYPES,
    BUN_SQLITE_COBBLE_USERS,
    BunSQLiteTables,
} from "@/db/types/db";
import setUserPassword from "@/src/functions/backend/auth/set-user-password";
import validatePassword from "@/src/utils/validate-password";
import ensureCoordinatorBot from "@/src/functions/backend/db/bots/ensure-coordinator-bot";
import ensureMainComputer from "@/src/functions/backend/db/computers/ensure-main-computer";

const FIRST_NAME = process.env.SEED_SUPER_ADMIN_FIRST_NAME || "Super";
const LAST_NAME = process.env.SEED_SUPER_ADMIN_LAST_NAME || "Admin";
const EMAIL =
    process.env.SEED_SUPER_ADMIN_EMAIL || "super.admin@example.com";
const USERNAME =
    process.env.SEED_SUPER_ADMIN_USERNAME || "super_admin";
const PASSWORD = process.env.SEED_SUPER_ADMIN_PASSWORD;

async function seedSuperAdmin() {
    const password_error = validatePassword({ password: PASSWORD });

    if (password_error || !PASSWORD) {
        console.error(`SEED_SUPER_ADMIN_PASSWORD: ${password_error}`);
        process.exit(1);
    }

    const existing = (
        await BunSQLite.select<
            BUN_SQLITE_COBBLE_USERS,
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
            BUN_SQLITE_COBBLE_USERS,
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
            BUN_SQLITE_COBBLE_USER_TYPES,
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

    await setUserPassword({ user_id: Number(user_id), password: PASSWORD });
    console.log(`Set the password for user #${user_id}.`);

    const coordinator_id = await ensureCoordinatorBot({ user_id });
    console.log(`Coordinator bot is #${coordinator_id}.`);

    const main_computer_id = await ensureMainComputer({
        user_id,
        coordinator_id,
    });
    console.log(`Main computer is #${main_computer_id}.`);

    if (has_super_admin) {
        console.log(`User #${user_id} already has the super_admin type.`);
        return;
    }

    const type_res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_USER_TYPES,
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
    `Seed complete. Log in as ${EMAIL} or ${USERNAME} at /auth/login.`,
);
process.exit(0);