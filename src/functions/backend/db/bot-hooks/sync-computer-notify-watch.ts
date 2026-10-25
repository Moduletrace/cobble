import BunSQLite from "@moduletrace/bun-sqlite";
import { NotifyWatchScript, NotifyWatchVersion } from "@/src/data/notify-watch-script";
import { BotHookPath } from "@/src/dict/bot-hook-dict";
import grabComputerAppUrl from "@/src/functions/backend/docker/grab-computer-app-url";
import type { NotifyWatchSync } from "@/src/types";
import computerNotReadyMessage from "@/src/utils/computer-not-ready-message";
import { decrypt } from "@/src/utils/crypt";
import notifyWatchEnsureCommand from "@/src/utils/notify-watch-ensure-command";
import grabComputerMcpUrl from "../computers/grab-computer-mcp-url";
import callComputerApi from "./call-computer-api";

type Params = {
    computer_id: number | string;
};

/**
 * Gives a computer's notification watcher the URLs of every hook that's on
 * and wants that computer's browser notifications, and keeps it running:
 * writes the watcher (`NotifyWatchScript`) and its URL list
 * (`~/.cobble/notify-hooks`, owner only), then starts it and restarts
 * Chrome when needed (`notifyWatchEnsureCommand`), but never while a task
 * works on the computer. With no such hooks the list is emptied and the
 * watcher, if there, forwards nothing. Never throws: run after every
 * change to those hooks and by the `sync-computers` cron, so a recreated
 * container gets its watcher back.
 */
export default async function syncComputerNotifyWatch({ computer_id }: Params): Promise<NotifyWatchSync> {
    try {
        const hooks =
            (
                await BunSQLite.sql<{ id: number; watch_token: string | null }>({
                    sql: `SELECT id, watch_token FROM bot_hooks
                        WHERE source = 'browser_notifications' AND watch_computer_id = ? AND enabled = 1
                        ORDER BY id`,
                    values: [computer_id],
                })
            ).payload || [];

        const address = await grabComputerMcpUrl({ computer_id });

        if (!address) {
            return { ok: false, watching: false, hooks: hooks.length, error: `The computer has no container.` };
        }

        if (!address.ready) {
            return { ok: false, watching: false, hooks: hooks.length, error: computerNotReadyMessage(address) };
        }

        const base_url = address.base_url;
        const context = await callComputerApi({ base_url, path: `/v1/sandbox` });
        const dir = `${String(context.home_dir || "/home/gem").replace(/\/+$/, "")}/.cobble`;

        if (!hooks.length) {
            await callComputerApi({
                base_url,
                path: `/v1/shell/exec`,
                body: { command: `[ -f ${dir}/notify-hooks ] && : > ${dir}/notify-hooks; true` },
            });

            return { ok: true, watching: false, hooks: 0 };
        }

        const app_url = await grabComputerAppUrl();

        if (!app_url) {
            return {
                ok: false,
                watching: false,
                hooks: hooks.length,
                error: `Computers can't reach the app: set COMPUTER_APP_URL in Settings, under Environment.`,
            };
        }

        const urls = await Promise.all(
            hooks
                .filter((hook) => hook.watch_token)
                .map(async (hook) => `${app_url}${BotHookPath}/${await decrypt(hook.watch_token!)}`),
        );

        await callComputerApi({
            base_url,
            path: `/v1/shell/exec`,
            body: { command: `mkdir -p ${dir} && chmod 700 ${dir} && touch ${dir}/notify-hooks && chmod 600 ${dir}/notify-hooks` },
        });

        await callComputerApi({
            base_url,
            path: `/v1/file/write`,
            body: { file: `${dir}/notify-watch.py`, content: NotifyWatchScript },
        });

        await callComputerApi({
            base_url,
            path: `/v1/file/write`,
            body: { file: `${dir}/notify-hooks`, content: `${urls.join("\n")}\n` },
        });

        const busy = Boolean(
            (
                await BunSQLite.sql<{ id: number }>({
                    sql: `SELECT id FROM bots_queue WHERE computer_id = ? AND status = 'processing' LIMIT 1`,
                    values: [computer_id],
                })
            ).payload?.[0],
        );

        const res = await callComputerApi({
            base_url,
            path: `/v1/shell/exec`,
            body: { command: notifyWatchEnsureCommand({ version: NotifyWatchVersion, restart_browser: !busy }) },
            timeout_ms: 30_000,
        });

        const output = String(res?.data?.output ?? "").trim();
        const result = JSON.parse(output.split("\n").filter(Boolean).pop() || "{}");

        return {
            ok: Boolean(result.ok),
            watching: Boolean(result.watching),
            browser: result.browser,
            hooks: urls.length,
            error: result.error ? String(result.error) : undefined,
        };
    } catch (error) {
        return {
            ok: false,
            watching: false,
            hooks: 0,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
