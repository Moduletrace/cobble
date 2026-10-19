import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import buildCustomTool from "@/src/harness/tools/custom/build-custom-tool";
import AppError from "@/src/utils/app-error";
import type { DraftCustomTool } from "@/src/schemas/extension-schema";
import type { CustomToolRecord } from "@/src/types";
import grabCustomTool from "./grab-custom-tool";
import grabRunEnvs from "./grab-run-envs";

type Params = {
    /**
     * A saved tool: the run counts as its last one.
     */
    custom_tool_id?: number | string;
    /**
     * The tool as its form has it, saved or not: nothing is recorded.
     */
    draft?: DraftCustomTool;
    args: Record<string, unknown>;
    /**
     * Where a script tool runs. The main computer when not given.
     */
    computer_id?: number;
};

/**
 * Runs a custom tool once with these arguments, as a bot would outside a
 * workspace (general envs, the main computer for a script), and returns
 * what the bot would read (its result, or `Error: ...`) and whether it
 * worked. A saved tool's run counts as its last one (`buildCustomTool`);
 * a draft's isn't recorded.
 */
export default async function testCustomTool({ custom_tool_id, draft, args, computer_id }: Params) {
    const tool: CustomToolRecord = draft
        ? ({
              ...draft,
              id: 0,
              name: "draft",
              description: "",
              all_bots: false,
              enabled: true,
              status: "untested",
              last_error: "",
              last_checked_at: null,
          } as CustomToolRecord)
        : await grabCustomTool({ custom_tool_id: custom_tool_id || 0 });
    const main =
        computer_id ||
        (await BunSQLite.sql<{ id: number }>({ sql: `SELECT id FROM computers WHERE kind = 'main' ORDER BY id LIMIT 1` }))
            .payload?.[0]?.id;

    const harness_tool = buildCustomTool({ tool, envs: await grabRunEnvs(), computer_id: main, record: !draft });

    if (!harness_tool) throw new AppError(`There's no computer to run this script on.`);

    try {
        const output = await harness_tool.run({ args, signal: AbortSignal.timeout(AppData.CustomToolMaxTimeoutMs) });
        return { output, ok: true };
    } catch (error: unknown) {
        return { output: `Error: ${error instanceof Error ? error.message : String(error)}`, ok: false };
    }
}

