import { z } from "zod";
import grabCustomTool from "@/src/functions/backend/db/extensions/grab-custom-tool";
import saveCustomTool from "@/src/functions/backend/db/extensions/save-custom-tool";
import testCustomTool from "@/src/functions/backend/db/extensions/test-custom-tool";
import logEvent from "@/src/functions/backend/logger";
import type { HarnessTool } from "../../../types";
import assertSuperAdminRun from "./assert-super-admin-run";
import mergeCustomToolChanges from "./merge-custom-tool-changes";

type Params = {
    user_id: number | string;
};

type Args = {
    custom_tool_id: number;
    name?: string;
    description?: string;
    parameters?: Record<string, unknown>;
    enabled?: boolean;
    all_bots?: boolean;
    test_args?: Record<string, unknown>;
};

/**
 * Lets the coordinator change a custom tool's name, description, arguments
 * and whether it's on, and try it. What it runs and where it sends (its
 * kind and config) are never changed here: those go through
 * `propose_custom_tool`, which the super admin confirms.
 */
export default function updateCustomToolTool({ user_id }: Params): HarnessTool<Args> {
    return {
        name: "update_custom_tool",
        description: `Change a custom tool's name, description, parameters (the JSON schema of its arguments), enabled or all_bots (gives it to every bot now and every new one). Every field you leave out stays. Give test_args to run it once afterwards (a script on the main computer) and see what a bot would get back; test_args alone just tries it. To add a tool, or change its kind or config (what it runs, where it sends), use propose_custom_tool: the user confirms those.`,
        schema: z.object({
            custom_tool_id: z.number().int().positive(),
            name: z.string().trim().max(80).optional(),
            description: z.string().trim().max(2000).optional(),
            parameters: z.record(z.string(), z.unknown()).optional().describe("JSON schema of the arguments object"),
            enabled: z.boolean().optional(),
            all_bots: z.boolean().optional(),
            test_args: z.record(z.string(), z.unknown()).optional().describe("Arguments to try it with"),
        }),
        run: async ({ args }) => {
            await assertSuperAdminRun({ user_id });

            const { custom_tool_id, test_args, ...changes } = args;
            const current = await grabCustomTool({ custom_tool_id });
            const changing = Object.values(changes).some((value) => value !== undefined);

            if (changing) {
                await saveCustomTool({ user_id, data: mergeCustomToolChanges({ current, changes }) });

                await logEvent({
                    title: "Tool changed",
                    category: "system",
                    user_id: Number(user_id),
                    plain_text: `The coordinator changed the tool ${changes.name || current.name} (#${custom_tool_id}).`,
                    metadata: { custom_tool_id },
                });
            }

            const saved = await grabCustomTool({ custom_tool_id });
            const head = changing
                ? `Tool #${custom_tool_id} ${saved.name} is saved and ${saved.enabled ? "on" : "off"}.`
                : `Tool #${custom_tool_id} ${saved.name} is unchanged.`;

            if (!test_args) return changing ? `${head} It wasn't tried: give test_args to try it.` : head;

            const test = await testCustomTool({ custom_tool_id, args: test_args });

            return `${head} Tried it: ${test.ok ? "it worked" : "it failed"}. What a bot would get back:\n${test.output}`;
        },
    };
}
