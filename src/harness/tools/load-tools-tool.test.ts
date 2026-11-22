import { describe, expect, test } from "bun:test";
import type { HarnessTool } from "../types";
import loadToolsTool, { LoadToolsToolName } from "./load-tools-tool";

const tool = ({ name, group }: { name: string; group?: string }): HarnessTool => ({
    name,
    description: `The ${name} tool.`,
    schema: undefined as unknown as HarnessTool["schema"],
    group,
    deferred: true,
    run: async () => "",
});

const deferred = [
    tool({ name: "list_tasks", group: "tasks" }),
    tool({ name: "create_task", group: "tasks" }),
    tool({ name: "create_plan", group: "plans" }),
    tool({ name: "exa__web_search_exa" }),
    tool({ name: "exa__crawling_exa" }),
];

function loading() {
    const loaded: string[][] = [];
    const is_loaded = new Set<string>();

    const loader = loadToolsTool({
        deferred,
        isLoaded: (name) => is_loaded.has(name),
        onLoad: (names) => {
            loaded.push(names);
            for (const name of names) is_loaded.add(name);
        },
    });

    return { loader, loaded };
}

describe(`loadToolsTool (${LoadToolsToolName})`, () => {
    test("exact names load exactly those tools", async () => {
        const { loader, loaded } = loading();

        const result = await loader.run({ args: { names: ["list_tasks"] }, context: {} } as never);

        expect(loaded).toEqual([["list_tasks"]]);
        expect(String(result)).toContain("Loaded: list_tasks.");
    });

    test("a family's name loads the whole family", async () => {
        const { loader, loaded } = loading();

        await loader.run({ args: { names: ["tasks"] }, context: {} } as never);

        expect(loaded).toEqual([["list_tasks", "create_task"]]);
    });

    test("a prefix loads every tool under it", async () => {
        const { loader, loaded } = loading();

        await loader.run({ args: { names: ["exa__*"] }, context: {} } as never);

        expect(loaded).toEqual([["exa__web_search_exa", "exa__crawling_exa"]]);
    });

    test("a family and a name can be loaded in one call, each once", async () => {
        const { loader, loaded } = loading();

        await loader.run({ args: { names: ["tasks", "list_tasks", "create_plan"] }, context: {} } as never);

        expect(loaded).toEqual([["list_tasks", "create_task", "create_plan"]]);
    });

    test("a tool already loaded is named as such, not loaded twice", async () => {
        const { loader, loaded } = loading();

        await loader.run({ args: { names: ["create_plan"] }, context: {} } as never);
        const second = await loader.run({ args: { names: ["create_plan", "tasks"] }, context: {} } as never);

        expect(loaded).toEqual([["create_plan"], ["list_tasks", "create_task"]]);
        expect(String(second)).toContain("Already loaded: create_plan.");
    });

    test("a name nothing answers says so, without spoiling the rest", async () => {
        const { loader, loaded } = loading();

        const result = await loader.run({ args: { names: ["tasks", "no_such_tool"] }, context: {} } as never);

        expect(loaded).toEqual([["list_tasks", "create_task"]]);
        expect(String(result)).toContain("Not in the list: no_such_tool.");
        expect(String(result)).toContain("family names");
    });
});
