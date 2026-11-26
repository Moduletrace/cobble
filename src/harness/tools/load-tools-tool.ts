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
 * loads every deferred tool it starts; a family's name (`tasks`, `plans`)
 * loads every tool in it.
 */
export default function loadToolsTool({ deferred, isLoaded, onLoad }: Params): HarnessTool<{ names: string[] }> {
    return {
        name: LoadToolsToolName,
        description: `Loads tools from the "Tools you can load" list in your instructions, so you can call them from your next step. Give their exact names, a family's name to load all of it ("tasks"), or "<prefix>*" to load every listed tool starting with the prefix (e.g. one server's). Load only what you're about to use.`,
        schema: z.object({
            names: z.array(z.string().trim().min(1).max(200)).min(1).max(40),
        }),
        run: async ({ args }) => {
            const found = new Set<string>();
            const missing: string[] = [];

            for (const name of args.names) {
                const matches = name.endsWith("*")
                    ? deferred.filter((tool) => tool.name.startsWith(name.slice(0, -1)))
                    : deferred.filter((tool) => tool.name == name || tool.group == name);

                if (!matches.length) missing.push(name);

                for (const tool of matches) found.add(tool.name);
            }

            const fresh = [...found].filter((name) => !isLoaded(name));
            const already = [...found].filter((name) => isLoaded(name));

            if (fresh.length) onLoad(fresh);

            /**
             * A name already offered inline isn't in the loadable list at all,
             * so without this a run that had the tool in hand was sent looking
             * for it in a list it wasn't in, and gave up (production:
             * `load_tools("browser")`).
             */
            const ready = missing.filter((name) => isLoaded(name));

            return [
                fresh.length ? `Loaded: ${fresh.join(", ")}. Call them from your next step.` : "",
                already.length ? `Already loaded: ${already.join(", ")}.` : "",
                missing.length
                    ? `Not in the list: ${missing.join(", ")}.${
                          ready.length ? ` Already yours, no loading needed: ${ready.join(", ")}.` : ""
                      } Use the exact names or family names under "Tools you can load", and a computer or browser tool a reply doesn't carry is work for send_reply with status "working".`
                    : "",
            ]
                .filter(Boolean)
                .join("\n");
        },
    };
}
