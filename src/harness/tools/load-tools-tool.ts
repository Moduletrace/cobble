import { z } from "zod";
import type { HarnessTool } from "../types";

type Params = {
    /**
     * The run's deferred tools (`HarnessTool.deferred`).
     */
    deferred: HarnessTool[];
    /**
     * Whether a tool is already loaded.
     */
    isLoaded: (name: string) => boolean;
    /**
     * Loads them: their definitions go with every turn from the next one.
     */
    onLoad: (names: string[]) => void;
};

export const LoadToolsToolName = "load_tools";

/**
 * Brings deferred tools into the run (`runTextLoop`): the model sees them
 * listed by name in its prompt and loads the ones it needs, rather than
 * every turn carrying every extension's definitions. A name ending in `*`
 * loads every deferred tool it starts.
 */
export default function loadToolsTool({ deferred, isLoaded, onLoad }: Params): HarnessTool<{ names: string[] }> {
    return {
        name: LoadToolsToolName,
        description: `Loads tools from the "Tools you can load" list in your instructions, so you can call them from your next step. Give their exact names; "<prefix>*" loads every listed tool starting with the prefix (e.g. one server's). Load only what you're about to use.`,
        schema: z.object({
            names: z.array(z.string().trim().min(1).max(200)).min(1).max(40),
        }),
        run: async ({ args }) => {
            const found = new Set<string>();
            const missing: string[] = [];

            for (const name of args.names) {
                const matches = name.endsWith("*")
                    ? deferred.filter((tool) => tool.name.startsWith(name.slice(0, -1)))
                    : deferred.filter((tool) => tool.name == name);

                if (!matches.length) missing.push(name);

                for (const tool of matches) found.add(tool.name);
            }

            const fresh = [...found].filter((name) => !isLoaded(name));
            const already = [...found].filter((name) => isLoaded(name));

            if (fresh.length) onLoad(fresh);

            return [
                fresh.length ? `Loaded: ${fresh.join(", ")}. Call them from your next step.` : "",
                already.length ? `Already loaded: ${already.join(", ")}.` : "",
                missing.length ? `Not in the list: ${missing.join(", ")}. Use the exact names under "Tools you can load".` : "",
            ]
                .filter(Boolean)
                .join("\n");
        },
    };
}
