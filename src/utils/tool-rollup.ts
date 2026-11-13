import toolLabel from "@/src/utils/tool-label";

type Params = {
    /**
     * A bot message's `tool_log` (JSON list of `{ name, ok }`).
     */
    tool_log?: string | null;
};

export type ToolRollupEntry = {
    /**
     * The tool's name, as the run called it.
     */
    name: string;
    /**
     * What it does, in words (`toolLabel`).
     */
    label: string;
    count: number;
    /**
     * How many of its calls came back an error.
     */
    failed: number;
};

export type ToolRollup = {
    calls: number;
    failed: number;
    /**
     * Every tool the run called, most used first.
     */
    tools: ToolRollupEntry[];
};

type ToolUse = {
    name?: unknown;
    ok?: unknown;
};

/**
 * A message's tool calls counted by tool: 242 calls of a run that converted
 * nothing read "242 model calls, 10.1M tokens" without it, and the same
 * reads "210 computer_bash, 12 start_task" with it. Null when the message
 * has no record of a run (a user message, an interim one, an older one).
 */
export default function toolRollup({ tool_log }: Params): ToolRollup | null {
    if (!tool_log) return null;

    let uses: unknown;

    try {
        uses = JSON.parse(tool_log);
    } catch {
        return null;
    }

    if (!Array.isArray(uses)) return null;

    const counts = new Map<string, { count: number; failed: number }>();

    for (const use of uses as ToolUse[]) {
        const name = typeof use?.name == "string" ? use.name : "";

        if (!name) continue;

        const entry = counts.get(name) || { count: 0, failed: 0 };

        entry.count++;
        if (use.ok === false) entry.failed++;
        counts.set(name, entry);
    }

    const tools = [...counts].map(([name, entry]) => ({
        name,
        label: toolLabel({ name }),
        count: entry.count,
        failed: entry.failed,
    }));

    return {
        calls: tools.reduce((total, tool) => total + tool.count, 0),
        failed: tools.reduce((total, tool) => total + tool.failed, 0),
        tools: tools.sort((left, right) => right.count - left.count || left.name.localeCompare(right.name)),
    };
}