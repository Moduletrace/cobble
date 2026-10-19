import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import buildCustomTool from "@/src/harness/tools/custom/build-custom-tool";
import AppError from "@/src/utils/app-error";
import grabCustomTool from "./grab-custom-tool";
import grabRunEnvs from "./grab-run-envs";

type Params = {
    custom_tool_id: number | string;
    args: Record<string, unknown>;
    /**
     * Where a script tool runs. The main computer when not given.
     */
    computer_id?: number;
};

/**
 * Runs a custom tool once with these arguments, as a bot would outside a
 * workspace (general envs, the main computer for a script), and returns
 * what the bot would read: its result, or `Error: ...`.
 */
export default async function testCustomTool({ custom_tool_id, args, computer_id }: Params) {
    const tool = await grabCustomTool({ custom_tool_id });
    const main =
        computer_id ||
        (await BunSQLite.sql<{ id: number }>({ sql: `SELECT id FROM computers WHERE kind = 'main' ORDER BY id LIMIT 1` }))
            .payload?.[0]?.id;

    const harness_tool = buildCustomTool({ tool, envs: await grabRunEnvs(), computer_id: main });

    if (!harness_tool) throw new AppError(`There's no computer to run this script on.`);

    try {
        return await harness_tool.run({ args, signal: AbortSignal.timeout(AppData.CustomToolMaxTimeoutMs) });
    } catch (error: unknown) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
}

