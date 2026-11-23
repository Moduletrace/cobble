import { describe, expect, test } from "bun:test";
import path from "path";
import { WrapUpHandOffToolNames, WrapUpSaveToolNames } from "@/src/harness/text/run-text-loop";
import { WritingToolNames } from "./writing-tool-names";
import { AppCardRefToolNames, WorkStartingTools } from "@/src/utils/reply-claim-problems";
import { AppStateTools } from "@/src/utils/reply-app-state-claims";
import PlanWorkStartingTools from "@/src/utils/plan-work-starting-tools";
import { PlanModeToolNames } from "./bot/plan-mode-tools";

/**
 * Tool names written straight into a list go stale when a tool is renamed:
 * `ask_crew` became `ask_bot` and three lists kept the old name, one of
 * them (`WorkStartingTools`) enough that a reply which really had asked the
 * crew was faulted for claiming work it did. The lists are checked against
 * the tools the harness declares, so a rename can't leave one behind.
 */
async function declaredToolNames() {
    const names = new Set<string>();
    const roots = [import.meta.dir, path.resolve(import.meta.dir, "../../dict")];
    const patterns = [
        /name:\s*"([a-z][a-z0-9_]{2,})"/g,
        /**
         * A name kept in a dict as a constant (`LoadSkillToolName`) is
         * declared too: the list must follow it if its value changes.
         */
        /ToolName\s*=\s*"([a-z][a-z0-9_]{2,})"/g,
    ];

    for (const root of roots) {
        for (const file of new Bun.Glob("**/*.ts").scanSync({ cwd: root, absolute: true })) {
            if (file.endsWith(".test.ts")) continue;

            const text = await Bun.file(file).text();

            for (const pattern of patterns) {
                for (const matched of text.matchAll(pattern)) {
                    names.add(matched[1]!);
                }
            }
        }
    }

    return names;
}

const Lists: Record<string, readonly string[]> = {
    WorkStartingTools,
    PlanWorkStartingTools,
    AppCardRefToolNames,
    AppStateTools,
    WritingToolNames,
    WrapUpSaveToolNames,
    WrapUpHandOffToolNames,
    PlanModeToolNames,
};

describe("harness tool name lists", () => {
    test("every name in one is a tool the harness declares", async () => {
        const declared = await declaredToolNames();

        const entries: [string, readonly string[]][] = Object.entries(Lists);

        const stale = entries
            .map(([list, names]) => [list, names.filter((name) => !declared.has(name))] as const)
            .filter(([, names]) => names.length > 0);

        expect(stale).toEqual([]);
    });
});
