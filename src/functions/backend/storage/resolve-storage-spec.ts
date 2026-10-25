import path from "node:path";
import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import computersSql from "@/src/utils/crew-access/computers-sql";
import reachableBotsSql from "@/src/utils/crew-access/reachable-bots-sql";
import workspacesSql from "@/src/utils/crew-access/workspaces-sql";
import grabDirNames from "@/src/utils/grab-dir-names";
import type { CrewRole } from "@/src/utils/rbac/crew-role";
import { storageVolumeLabel, type StorageSpec } from "@/src/utils/storage-volumes";
import grabCrewRole from "../db/access/grab-crew-role";
import grabComputerFolderAccess from "./grab-computer-folder-access";
import grabUserBot from "../db/bots/grab-user-bot";
import grabUserComputer from "../db/computers/grab-user-computer";
import resolveComputerWorkspaceDir from "../db/computers/resolve-computer-workspace-dir";
import grabEnv from "../db/envs/grab-env";
import grabUserWorkspace from "../db/workspaces/grab-user-workspace";

type Params = {
    user_id: number | string;
    spec: StorageSpec;
};

/**
 * One browsable folder, only if the user reaches it: its absolute root on
 * the data volume and a label for the page. Null when the folder is not
 * theirs to open, so a request never turns into a path before this has
 * passed.
 *
 * Who reaches what: a bot, workspace or computer through the same SQL the
 * crew uses (`grabUserBot`, `grabUserWorkspace`, `grabUserComputer`, so a
 * member sees only their own grants); their own media folder, and only
 * their own whatever their role; an MCP server's install folder for crew
 * managers; the database for the super admin alone. Inside a computer's
 * workspace a member sees only their bots' folders, their own user folder
 * in each, and their workspaces' (`computerPathAllowed`).
 */
export default async function resolveStorageSpec({ user_id, spec }: Params) {
    const role = await grabCrewRole({ user_id });
    const root = await storageRoot({ spec, role, user_id });

    if (!root) return null;

    return {
        spec,
        root,
        label: await storageLabel({ spec, role, user_id }),
        /**
         * A computer's workspace: which of its folders the user may see,
         * and their names (`computerPathAllowed`, `computerFolderLabel`).
         */
        computer: spec.volume == "computers" ? await grabComputerFolderAccess({ role, user_id }) : null,
    };
}

export type ResolvedStorageSpec = NonNullable<Awaited<ReturnType<typeof resolveStorageSpec>>>;

/**
 * The folder's absolute root, when the user reaches it.
 */
async function storageRoot({
    spec,
    role,
    user_id,
}: {
    spec: StorageSpec;
    role: CrewRole;
    user_id: number | string;
}) {
    const { DATA_DIR } = grabDirNames();

    switch (spec.volume) {
        case "bots":
            return (await grabUserBot({ bot_id: spec.owner_id, user_id }))
                ? path.join(DATA_DIR, AppData.BotDataDir, String(spec.owner_id))
                : null;

        case "workspaces":
            return (await grabUserWorkspace({ workspace_id: spec.owner_id, user_id }))
                ? path.join(DATA_DIR, AppData.WorkspaceDataDir, String(spec.owner_id))
                : null;

        case "computers": {
            const computer = await grabUserComputer({ computer_id: spec.owner_id, user_id });

            if (!computer) return null;

            return resolveComputerWorkspaceDir({
                computer_id: spec.owner_id,
                kind: computer.kind,
                metadata: await computerContainerMetadata({ container_id: computer.container_id }),
                main_data_dir: await grabEnv({ key: "MAIN_COMPUTER_DATA_DIR" }),
                data_dir: DATA_DIR,
            });
        }

        case "media":
            /**
             * A person's uploads are theirs alone, whatever their role:
             * the folder is the media library behind `/media/<id>`, not a
             * crew-shared one.
             */
            if (Number(spec.owner_id) != Number(user_id)) return null;

            return (await hasUser({ user_id: spec.owner_id }))
                ? path.join(DATA_DIR, "media", String(spec.owner_id))
                : null;

        case "mcp":
            if (role == "member") return null;

            return (await hasMcpServer({ server_id: spec.owner_id }))
                ? path.join(DATA_DIR, AppData.McpDataDir, String(spec.owner_id))
                : null;

        case "db":
            if (role != "super_admin") return null;

            return dbRoot();
    }
}

/**
 * A computer's container `metadata`, where `provisionComputer` recorded
 * the directory it bind-mounted as the computer's home. Null when the app
 * didn't create the container (a computer reached at
 * `MAIN_COMPUTER_URL`), which is what `MAIN_COMPUTER_DATA_DIR` is for.
 */
async function computerContainerMetadata({ container_id }: { container_id?: number | "" }) {
    if (!container_id) return null;

    const res = await BunSQLite.sql<{ metadata?: string | null }>({
        sql: `SELECT metadata FROM containers WHERE id = ? LIMIT 1`,
        values: [container_id],
    });

    return res.payload?.[0]?.metadata || null;
}

/**
 * What the page calls the folder: the bot's, workspace's or computer's
 * own name where one is known.
 */
async function storageLabel({
    spec,
    role,
    user_id,
}: {
    spec: StorageSpec;
    role: CrewRole;
    user_id: number | string;
}) {
    switch (spec.volume) {
        case "bots":
            return (await grabUserBot({ bot_id: spec.owner_id, user_id }))?.name || `Bot ${spec.owner_id}`;
        case "workspaces":
            return (
                (await grabUserWorkspace({ workspace_id: spec.owner_id, user_id }))?.name ||
                `Workspace ${spec.owner_id}`
            );
        case "computers":
            return (
                (await grabUserComputer({ computer_id: spec.owner_id, user_id }))?.name ||
                `Computer ${spec.owner_id}`
            );
        case "media":
            return "My media";
        case "mcp":
            return (await grabMcpServerName({ server_id: spec.owner_id })) || `MCP server ${spec.owner_id}`;
        case "db":
            return storageVolumeLabel({ volume: spec.volume });
    }
}

/**
 * Where the database is kept: `DB_DIR` on the data volume in the app's
 * container, else the folder bun-sqlite uses from the working directory.
 */
function dbRoot() {
    const dir = process.env.DB_DIR || "./db";

    return path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
}

async function hasUser({ user_id }: { user_id: number | string }) {
    const res = await BunSQLite.sql<{ id: number }>({
        sql: `SELECT id FROM users WHERE id = ? LIMIT 1`,
        values: [Number(user_id)],
    });

    return Boolean(res.payload?.[0]?.id);
}

async function hasMcpServer({ server_id }: { server_id: number | string }) {
    const res = await BunSQLite.sql<{ id: number }>({
        sql: `SELECT id FROM mcp_servers WHERE id = ? LIMIT 1`,
        values: [Number(server_id)],
    });

    return Boolean(res.payload?.[0]?.id);
}

async function grabMcpServerName({ server_id }: { server_id: number | string }) {
    const res = await BunSQLite.sql<{ name?: string | null }>({
        sql: `SELECT name FROM mcp_servers WHERE id = ? LIMIT 1`,
        values: [Number(server_id)],
    });

    return res.payload?.[0]?.name || "";
}

export type StorageSpecOption = {
    spec: StorageSpec;
    label: string;
};

/**
 * Every folder a user can open, for the page's picker: their bots,
 * workspaces and computers, their own media folder, and (for crew
 * managers) every MCP server's folder. The database comes last, for the
 * super admin alone. The crew SQL is the same as the rest of the app, so
 * the picker never lists a folder the resolver would refuse.
 */
export async function grabStorageSpecs({
    user_id,
}: {
    user_id: number | string;
}): Promise<StorageSpecOption[]> {
    const role = await grabCrewRole({ user_id });
    const options: StorageSpecOption[] = [];

    const bot_access = reachableBotsSql({ role, user_id });
    const bots = await rows<{ id: number; name?: string | null }>({
        sql: `SELECT b.id, b.name FROM bots b WHERE ${bot_access.sql} ORDER BY b.name`,
        values: bot_access.values,
    });

    for (const bot of bots) {
        options.push({
            spec: { volume: "bots", owner_id: Number(bot.id) },
            label: bot.name || `Bot ${bot.id}`,
        });
    }

    const workspace_access = workspacesSql({ role, user_id });
    const workspaces = await rows<{ id: number; name?: string | null }>({
        sql: `SELECT w.id, w.name FROM workspaces w WHERE ${workspace_access.sql} AND w.archived = 0 ORDER BY w.name`,
        values: workspace_access.values,
    });

    for (const workspace of workspaces) {
        options.push({
            spec: { volume: "workspaces", owner_id: Number(workspace.id) },
            label: workspace.name || `Workspace ${workspace.id}`,
        });
    }

    const computer_access = computersSql({ role, user_id });
    const computers = await rows<{ id: number; name?: string | null }>({
        sql: `SELECT c.id, c.name FROM computers c WHERE ${computer_access.sql} ORDER BY c.name`,
        values: computer_access.values,
    });

    for (const computer of computers) {
        options.push({
            spec: { volume: "computers", owner_id: Number(computer.id) },
            label: computer.name || `Computer ${computer.id}`,
        });
    }

    options.push({ spec: { volume: "media", owner_id: Number(user_id) }, label: "My media" });

    if (role != "member") {
        const servers = await rows<{ id: number; name?: string | null }>({
            sql: `SELECT id, name FROM mcp_servers ORDER BY name`,
            values: [],
        });

        for (const server of servers) {
            options.push({
                spec: { volume: "mcp", owner_id: Number(server.id) },
                label: server.name || `MCP server ${server.id}`,
            });
        }
    }

    if (role == "super_admin") {
        options.push({ spec: { volume: "db", owner_id: 0 }, label: storageVolumeLabel({ volume: "db" }) });
    }

    return options;
}

async function rows<T extends { [k: string]: any }>({
    sql,
    values,
}: {
    sql: string;
    values: (string | number)[];
}) {
    return (await BunSQLite.sql<T>({ sql, values })).payload || [];
}
