import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_BOT_HARNESS_SETTINGS,
    BUN_SQLITE_COBBLE_HARNESS_SETTINGS,
    BUN_SQLITE_COBBLE_WORKSPACE_HARNESS_SETTINGS,
} from "@/db/types/db";
import { isInstallWideHarness, type HarnessKind } from "@/src/dict/harness-dict";
import parseJobJson from "@/src/bots-queue/parse-job-json";
import grabDefaultHarnessProviderId from "./grab-default-harness-provider-id";
import pickHarnessSettingRow, {
    type HarnessSettingSource,
} from "./pick-harness-setting-row";
import workspaceHarnessSettingSql from "./workspace-harness-setting-sql";

export type HarnessSetting = {
    harness: HarnessKind;
    /**
     * The picked `harness_models` row; undefined picks automatically.
     */
    model_id?: number;
    /**
     * The `harness_providers` row the harness is limited to (its pick
     * and its automatic picks); undefined: any provider.
     */
    provider_id?: number;
    fallback: boolean;
    enabled: boolean;
    options: Record<string, unknown>;
    /**
     * `bot` when a worker bot sets this harness, `workspace` when the
     * call's workspace does, `default` when neither does.
     */
    source: HarnessSettingSource;
};

type Params = {
    harness: HarnessKind;
    /**
     * The bot the call is for. A worker bot's own setting wins over the
     * default; the coordinator always uses the default.
     */
    bot_id?: number | string;
    /**
     * The workspace the call is in. Its setting applies to the worker
     * bots that have none of their own; the coordinator always uses the
     * default.
     */
    workspace_id?: number | string | null;
};

type SettingRow = Pick<
    BUN_SQLITE_COBBLE_HARNESS_SETTINGS,
    "model_id" | "provider_id" | "fallback" | "enabled" | "options"
>;

/**
 * A harness's setting for a call: the bot's own, else its workspace's,
 * else the default. With no row it is automatic on the default provider
 * (OpenRouter), on, with fallback. Text is always on. An install-wide
 * harness (embeddings) always takes the default: rows a bot or workspace
 * saved before it was one are ignored.
 */
export default async function grabHarnessSetting({
    harness,
    bot_id,
    workspace_id,
}: Params): Promise<HarnessSetting> {
    const install_wide = isInstallWideHarness({ harness });

    const bot_row =
        !install_wide && bot_id ? await grabBotOverride({ harness, bot_id }) : undefined;

    const workspace_row =
        !bot_row && !install_wide && workspace_id
            ? await grabWorkspaceOverride({ harness, workspace_id, bot_id })
            : undefined;

    const default_row =
        bot_row || workspace_row
            ? undefined
            : (
                  await BunSQLite.sql<BUN_SQLITE_COBBLE_HARNESS_SETTINGS>({
                      sql: `SELECT * FROM harness_settings WHERE harness = ? LIMIT 1`,
                      values: [harness],
                  })
              ).payload?.[0];

    const picked = pickHarnessSettingRow({ bot_row, workspace_row, default_row });

    if (!picked.row) {
        return {
            ...toSetting({ harness, source: picked.source }),
            provider_id: await grabDefaultHarnessProviderId(),
        };
    }

    return toSetting({ harness, row: picked.row, source: picked.source });
}

async function grabWorkspaceOverride({
    harness,
    workspace_id,
    bot_id,
}: {
    harness: HarnessKind;
    workspace_id: number | string;
    bot_id?: number | string;
}) {
    const query = workspaceHarnessSettingSql({ workspace_id, harness, bot_id });

    return (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_WORKSPACE_HARNESS_SETTINGS>(query)
    ).payload?.[0];
}

async function grabBotOverride({
    harness,
    bot_id,
}: {
    harness: HarnessKind;
    bot_id: number | string;
}) {
    return (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_HARNESS_SETTINGS>({
            sql: `SELECT s.* FROM bot_harness_settings s
                JOIN bots b ON b.id = s.bot_id
                WHERE s.bot_id = ? AND s.harness = ? AND b.kind != 'coordinator'
                LIMIT 1`,
            values: [bot_id, harness],
        })
    ).payload?.[0];
}

function toSetting({
    harness,
    row,
    source,
}: {
    harness: HarnessKind;
    row?: SettingRow;
    source: HarnessSetting["source"];
}): HarnessSetting {
    return {
        harness,
        model_id: typeof row?.model_id == "number" ? row.model_id : undefined,
        provider_id: typeof row?.provider_id == "number" ? row.provider_id : undefined,
        fallback: row ? row.fallback != 0 : true,
        enabled: harness == "text" || !row || row.enabled != 0,
        options: parseJobJson({ text: row?.options }) || {},
        source,
    };
}
