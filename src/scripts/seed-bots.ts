import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_BOT_MESSAGES,
    BUN_SQLITE_COBBLE_BOT_TASK_STEPS,
    BUN_SQLITE_COBBLE_BOT_TASKS,
    BUN_SQLITE_COBBLE_BOTS,
    BUN_SQLITE_COBBLE_USERS,
    BunSQLiteTables,
} from "@/db/types/db";
import type {
    BotFace,
    BotHue,
    BotMessageAuthor,
    BotTaskStepState,
} from "@/src/dict/bot-dict";
import setBotFace from "@/src/functions/backend/db/bots/set-bot-face";
import ensureCoordinatorBot from "@/src/functions/backend/db/bots/ensure-coordinator-bot";
import ensureBotSession from "@/src/functions/backend/db/bot-sessions/ensure-bot-session";

/**
 * Seeds the sample crew from the approved chat design into one user's
 * crew. The coordinator already exists (it's made with the account),
 * so its sample messages go onto it. Idempotent: skips a user who already
 * has worker bots.
 *
 * Usage: `bun run seed:bots [email]` (defaults to SEED_SUPER_ADMIN_EMAIL).
 */

const EMAIL =
    process.argv[2] ||
    process.env.SEED_SUPER_ADMIN_EMAIL ||
    "super.admin@example.com";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

type SeedMessage = {
    author: BotMessageAuthor;
    text: string;
    ago: number;
    needs_you?: boolean;
};

type SeedTask = {
    title: string;
    steps: { label: string; state: BotTaskStepState }[];
};

type SeedBot = {
    name: string;
    hue: BotHue | null;
    role: string | null;
    face: BotFace;
    status_line: string;
    unread?: boolean;
    messages: SeedMessage[];
    task?: SeedTask;
};

const Crew: SeedBot[] = [
    {
        name: "Coordinator",
        hue: null,
        role: null,
        face: "idle",
        status_line: "",
        messages: [
            {
                author: "bot",
                text: "Three bots are working. One needs you.",
                ago: 20 * 1000,
            },
            {
                author: "bot",
                text: "Shelf and Draft are done. Inbox needs you on the Zendesk login.",
                ago: 10 * 1000,
            },
        ],
    },
    {
        name: "Inbox",
        hue: "ember",
        role: "Triage your mail",
        face: "needs-you",
        status_line: "Waiting on you",
        messages: [
            {
                author: "user",
                text: "Chase the Zendesk queue today. Anything you can't get into, tell me.",
                ago: 7 * MINUTE,
            },
            {
                author: "bot",
                text: "Signed in. 14 tickets triaged, 3 need a decision from you.",
                ago: 4 * MINUTE,
            },
            {
                author: "bot",
                text: "Zendesk SSO wants a code I can't read. Send it and I'll finish the queue.",
                ago: 30 * 1000,
                needs_you: true,
            },
        ],
        task: {
            title: "Zendesk queue",
            steps: [
                { label: "Signed in", state: "done" },
                { label: "Triaged 14 tickets", state: "done" },
                { label: "Waiting on SSO code", state: "active" },
            ],
        },
    },
    {
        name: "Ledger",
        hue: "amber",
        role: "Match receipts to the ledger",
        face: "working",
        status_line: "Working",
        unread: true,
        messages: [
            { author: "bot", text: "Matched 14 receipts", ago: 2 * MINUTE },
        ],
        task: {
            title: "October receipts",
            steps: [
                { label: "Pulled 31 receipts", state: "done" },
                { label: "Matched 14 receipts", state: "active" },
                { label: "Flag the unmatched", state: "pending" },
            ],
        },
    },
    {
        name: "Watcher",
        hue: "cobalt",
        role: "Watch the build queue",
        face: "working",
        status_line: "Working",
        unread: true,
        messages: [
            {
                author: "bot",
                text: "Nothing new since 06:40",
                ago: 14 * MINUTE,
            },
        ],
    },
    {
        name: "Shelf",
        hue: "moss",
        role: "File your downloads",
        face: "done",
        status_line: "Done",
        messages: [{ author: "bot", text: "Filed 32 downloads", ago: HOUR }],
    },
    {
        name: "Reader",
        hue: "violet",
        role: "Summarise papers you save",
        face: "working",
        status_line: "Working",
        messages: [
            { author: "bot", text: "Summarised 3 papers", ago: 3 * HOUR },
        ],
    },
    {
        name: "Draft",
        hue: "rose",
        role: "Draft replies for review",
        face: "done",
        status_line: "Done",
        unread: true,
        messages: [
            {
                author: "bot",
                text: "Two replies ready to review",
                ago: 5 * HOUR,
            },
        ],
    },
    {
        name: "Sweep",
        hue: "teal",
        role: "Clear stale branches overnight",
        face: "asleep",
        status_line: "Asleep until 08:00",
        messages: [
            { author: "bot", text: "Asleep until 08:00", ago: 5 * DAY },
        ],
    },
];

type Table = (typeof BunSQLiteTables)[number];

async function insertBot({
    user_id,
    bot,
    now,
}: {
    user_id: number;
    bot: SeedBot;
    now: number;
}) {
    const last_ago = Math.min(...bot.messages.map((m) => m.ago));

    if (!bot.hue) {
        const coordinator_id = await ensureCoordinatorBot({ user_id });

        await setBotFace({ bot_id: coordinator_id, user_id, face: bot.face, status_line: bot.status_line });

        await insertMessages({ user_id, bot_id: coordinator_id, bot, now, last_ago });

        console.log(`  ${bot.name} (#${coordinator_id}, existing)`);
        return;
    }

    const bot_res = await BunSQLite.insert<BUN_SQLITE_COBBLE_BOTS, Table>({
        table: "bots",
        data: [
            {
                user_id,
                name: bot.name,
                kind: bot.hue ? "worker" : "coordinator",
                hue: bot.hue || undefined,
                role: bot.role || undefined,
            },
        ],
    });

    const bot_id = bot_res.postInsertReturn?.insertId;

    if (!bot_res.success || !bot_id) {
        throw new Error(`Failed to create bot ${bot.name}: ${bot_res.msg}`);
    }

    /**
     * Bots belong to the install: the user reaches a sample worker once
     * it's assigned to them.
     */
    await BunSQLite.sql({
        sql: `INSERT OR IGNORE INTO bot_users (created_at, updated_at, bot_id, user_id) VALUES (?, ?, ?, ?)`,
        values: [now, now, bot_id, user_id],
    });

    await setBotFace({ bot_id, user_id, face: bot.face, status_line: bot.status_line });

    const session_id = await insertMessages({ user_id, bot_id, bot, now, last_ago });

    if (bot.task) {
        await insertTask({ bot_id, session_id, task: bot.task });
    }

    console.log(`  ${bot.name} (#${bot_id})`);
}

/**
 * Adds the bot's sample messages to the user's own chat with it (its
 * active session) and returns the session's id.
 */
async function insertMessages({
    user_id,
    bot_id,
    bot,
    now,
    last_ago,
}: {
    user_id: number;
    bot_id: number;
    bot: SeedBot;
    now: number;
    last_ago: number;
}) {
    const session = await ensureBotSession({ user_id, bot_id });
    const session_id = Number(session.id);

    await BunSQLite.sql({
        sql: `UPDATE bot_sessions SET unread = ?, last_activity_at = ? WHERE id = ?`,
        values: [bot.unread ? 1 : 0, now - last_ago, session_id],
    });

    const messages_res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_BOT_MESSAGES,
        Table
    >({
        table: "bot_messages",
        data: bot.messages.map((message) => ({
            bot_id,
            session_id,
            author: message.author,
            text: message.text,
            needs_you: message.needs_you ? 1 : 0,
            created_at: now - message.ago,
            updated_at: now - message.ago,
        })),
    });

    if (!messages_res.success) {
        throw new Error(
            `Failed to add messages for ${bot.name}: ${messages_res.msg}`,
        );
    }

    return session_id;
}

async function insertTask({
    bot_id,
    session_id,
    task,
}: {
    bot_id: number;
    session_id: number;
    task: SeedTask;
}) {
    const task_res = await BunSQLite.insert<BUN_SQLITE_COBBLE_BOT_TASKS, Table>(
        {
            table: "bot_tasks",
            data: [{ bot_id, session_id, title: task.title, status: "active" }],
        },
    );

    const task_id = task_res.postInsertReturn?.insertId;

    if (!task_res.success || !task_id) {
        throw new Error(`Failed to create task ${task.title}: ${task_res.msg}`);
    }

    const steps_res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_BOT_TASK_STEPS,
        Table
    >({
        table: "bot_task_steps",
        data: task.steps.map((step, position) => ({
            task_id,
            label: step.label,
            state: step.state,
            position,
        })),
    });

    if (!steps_res.success) {
        throw new Error(`Failed to add steps for ${task.title}`);
    }
}

async function seedBots() {
    const user = (
        await BunSQLite.select<BUN_SQLITE_COBBLE_USERS, Table>({
            table: "users",
            query: { query: { email: { value: EMAIL } } },
        })
    ).payload?.[0];

    if (!user?.id) {
        console.error(
            `No user with email ${EMAIL}. Run \`bun run seed\` first or pass an email.`,
        );
        process.exit(1);
    }

    const existing_workers = (
        await BunSQLite.select<BUN_SQLITE_COBBLE_BOTS, Table>({
            table: "bots",
            query: {
                query: {
                    user_id: { value: user.id },
                    kind: { value: "worker" },
                },
            },
        })
    ).payload;

    if (existing_workers?.length) {
        console.log(
            `User #${user.id} <${EMAIL}> already created ${existing_workers.length} worker bots. Skipping.`,
        );
        return;
    }

    console.log(`Seeding crew for user #${user.id} <${EMAIL}>:`);

    const now = Date.now();

    for (const bot of Crew) {
        await insertBot({ user_id: Number(user.id), bot, now });
    }
}

await seedBots();
process.exit(0);
