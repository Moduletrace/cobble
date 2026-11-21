import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CUSTOM_TOOLS } from "@/db/types/db";
import type { SaveCustomToolRequest } from "@/src/schemas/extension-schema";
import extensionEnvUses from "@/src/utils/extension-env-uses";
import redactTemplateMap from "@/src/utils/redact-template-map";
import parseCustomToolRow from "../extensions/parse-custom-tool-row";
import type { ExtensionBundleEntry } from "./extension-bundle-entry";

type Params = {
    /**
     * The rows picked, or none for every one.
     */
    ids: number[];
};

/**
 * Custom tools as a bundle carries them: what each runs, with the headers
 * of an http tool left behind when they hold a key rather than an env
 * template. A body, a script and a prompt are the user's own text and go
 * as they are.
 */
export default async function exportTools({ ids }: Params): Promise<ExtensionBundleEntry[]> {
    const rows = await BunSQLite.sql<BUN_SQLITE_COBBLE_CUSTOM_TOOLS>({
        sql: `SELECT * FROM custom_tools ORDER BY name COLLATE NOCASE ASC, id ASC`,
    });

    const wanted = ids.length ? new Set(ids.map(Number)) : null;

    return (rows.payload || [])
        .map((row) => {
            const tool = parseCustomToolRow({ row });
            const base = {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
                enabled: tool.enabled,
                all_bots: false,
            };

            if (tool.kind == "http") {
                const headers = redactTemplateMap({ values: tool.config.headers || {}, label: "header" });
                const config: SaveCustomToolRequest = {
                    ...base,
                    kind: "http",
                    config: {
                        method: tool.config.method,
                        url: tool.config.url,
                        headers: headers.values,
                        body: tool.config.body || "",
                        timeout_ms: tool.config.timeout_ms,
                    },
                };

                return {
                    id: tool.id,
                    item: {
                        kind: "tool" as const,
                        key: tool.name,
                        config,
                        redacted: headers.redacted,
                        env_keys: [...new Set(extensionEnvUses({ kind: "tool", data: config }).sends.map((use) => use.key))],
                        notes: [],
                        documents: [],
                    },
                };
            }

            const config: SaveCustomToolRequest =
                tool.kind == "script"
                    ? {
                          ...base,
                          kind: "script",
                          config: {
                              language: tool.config.language,
                              code: tool.config.code,
                              timeout_ms: tool.config.timeout_ms,
                          },
                      }
                    : { ...base, kind: "prompt", config: { prompt: tool.config.prompt } };

            return {
                id: tool.id,
                item: {
                    kind: "tool" as const,
                    key: tool.name,
                    config,
                    redacted: [],
                    env_keys: [],
                    notes: [],
                    documents: [],
                },
            };
        });
}