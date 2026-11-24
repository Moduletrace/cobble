import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_COMPUTERS,
    BunSQLiteTables,
} from "@/db/types/db";
import type { ComputerBrowserSettings } from "@/src/schemas/computer-schema";
import AppError from "@/src/utils/app-error";
import parseComputerBrowserSettings from "@/src/utils/parse-computer-browser-settings";
import _ from "lodash";
import grabEnv from "../envs/grab-env";
import grabUserComputers from "./grab-user-computers";
import grabUserComputer from "./grab-user-computer";
import provisionComputer from "./provision-computer";

type Params = {
    user_id: number | string;
    computer_id: number | string;
    /**
     * Only the fields given are changed.
     */
    data: Pick<
        BUN_SQLITE_COBBLE_COMPUTERS,
        "name" | "description" | "cpus" | "memory_mb" | "ssh_host" | "ssh_port" | "ssh_user"
    > & {
        /**
         * The whole of its browser's settings (already checked by
         * `ComputerBrowserSettingsSchema`), replacing what's stored.
         */
        browser_settings?: ComputerBrowserSettings;
    };
};

/**
 * Updates one of the user's computers. When its container's settings
 * change (`cpus`, `memory_mb`, `browser_settings`), the container is stopped, removed and
 * run again with them in the background (`provisionComputer`); its home
 * directory is bind-mounted, so its files stay. A name or description
 * alone leaves the container running. The main computer of a server that
 * reaches it at `MAIN_COMPUTER_URL` has no container to recreate.
 */
export default async function updateComputer({ user_id, computer_id, data }: Params) {
    const computer = await grabUserComputer({ computer_id, user_id });

    if (!computer?.id) {
        throw new AppError(`Computer not found.`);
    }

    const is_ssh = computer.connection == "ssh";
    /**
     * A different server or account has a different home and host key.
     */
    const ssh_changed =
        is_ssh &&
        ((data.ssh_host !== undefined && data.ssh_host != computer.ssh_host) ||
            (data.ssh_user !== undefined && data.ssh_user != computer.ssh_user) ||
            (data.ssh_port !== undefined && Number(data.ssh_port) != Number(computer.ssh_port)));

    const browser_settings = data.browser_settings ? JSON.stringify(data.browser_settings) : undefined;
    const stored_browser_settings = JSON.stringify(parseComputerBrowserSettings({ text: computer.browser_settings }));

    const recreate =
        !is_ssh &&
        ((data.cpus !== undefined && Number(data.cpus) != Number(computer.cpus)) ||
        (data.memory_mb !== undefined && Number(data.memory_mb) != Number(computer.memory_mb)) ||
        (browser_settings !== undefined && browser_settings != stored_browser_settings));

    if (recreate && (await grabUserComputers({ computer_id: computer.id }))[0]?.status == "creating") {
        throw new AppError(`${computer.name || "The computer"} is still being set up. Try again once it's ready.`);
    }

    const res = await BunSQLite.update<
        BUN_SQLITE_COBBLE_COMPUTERS,
        (typeof BunSQLiteTables)[number]
    >({
        table: "computers",
        targetId: computer.id,
        /**
         * `BunSQLite.update` writes every key it gets, so a field left out
         * here would be set to null.
         */
        data: _.omitBy(
            {
                name: data.name,
                description: data.description,
                cpus: data.cpus,
                memory_mb: data.memory_mb,
                browser_settings,
                ssh_host: data.ssh_host,
                ssh_port: data.ssh_port,
                ssh_user: data.ssh_user,
                ssh_home: ssh_changed ? null : undefined,
                ssh_fingerprint: ssh_changed ? null : undefined,
            },
            _.isUndefined,
        ),
    });

    if (!res.success) {
        throw new Error(`Couldn't update the computer: ${res.msg}`);
    }

    const external =
        computer.kind == "main" && Boolean((await grabEnv({ key: "MAIN_COMPUTER_URL" }))?.trim());

    const recreating = recreate && !external && Boolean(computer.container_id);

    const provisioning = recreating
        ? provisionComputer({ computer_id: Number(computer.id) })
        : Promise.resolve();

    return { recreating, provisioning };
}
