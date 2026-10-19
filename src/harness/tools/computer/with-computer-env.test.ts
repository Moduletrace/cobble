import { describe, expect, test } from "bun:test";
import type { HarnessTool } from "../../types";
import composeComputerEnvFiles from "./compose-computer-env-files";
import withComputerEnv from "./with-computer-env";

const echoTool = (name: string): HarnessTool => ({
    name,
    description: "",
    parameters: {},
    run: async ({ args }) => JSON.stringify(args),
});

const paths = { shell_path: "/home/gem/.cobble/env", json_path: "/home/gem/.cobble/env.json" };
const signal = new AbortController().signal;

describe("withComputerEnv", () => {
    test("sources the env file before bash commands", async () => {
        const tool = withComputerEnv({ tool: echoTool("sandbox_execute_bash"), ...paths });
        const sent = JSON.parse(await tool.run({ args: { cmd: "echo $TOKEN" }, signal }));

        expect(sent.cmd).toBe("[ -f /home/gem/.cobble/env ] && . /home/gem/.cobble/env; echo $TOKEN");
    });

    test("loads the json file before python code", async () => {
        const tool = withComputerEnv({ tool: echoTool("sandbox_execute_code"), ...paths });
        const sent = JSON.parse(await tool.run({ args: { code: "print(1)", language: "python" }, signal }));

        expect(sent.code).toStartWith("import json as _cobble_json");
        expect(sent.code).toEndWith("\nprint(1)");
    });

    test("leaves other tools alone", () => {
        const tool = echoTool("browser_navigate");
        expect(withComputerEnv({ tool, ...paths })).toBe(tool);
    });
});

describe("composeComputerEnvFiles", () => {
    test("escapes single quotes for the shell", () => {
        expect(
            composeComputerEnvFiles({ envs: [{ key: "A", value: "it's" }] }).shell,
        ).toBe(`export A='it'\\''s'\n`);
    });

    test("is empty without envs", () => {
        expect(composeComputerEnvFiles({ envs: [] })).toEqual({ shell: "", json: "{}" });
    });
});
