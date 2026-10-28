import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import type { HarnessTool } from "../../types";
import withCommandTimeout from "./with-command-timeout";

const echoTool = (name: string): HarnessTool => ({
    name,
    description: "Run a command.",
    parameters: {},
    run: async ({ args }) => JSON.stringify(args),
});

const signal = new AbortController().signal;
const call = async (args: Record<string, unknown>) =>
    JSON.parse(await withCommandTimeout({ tool: echoTool("sandbox_execute_bash") }).run({ args, signal }));
const max = AppData.ComputerCommandMaxSeconds;

describe("withCommandTimeout", () => {
    test("runs the command under timeout, reading no input, in its own bash", async () => {
        const sent = await call({ cmd: "echo 'hi'", timeout: 20 });

        expect(sent.cmd).toStartWith(`timeout -k 5 20 bash -c 'echo '\\''hi'\\''' < /dev/null; `);
        expect(sent.cmd).toContain("[Stopped after 20s");
        expect(sent.cmd).toEndWith("(exit $_cobble_status)");
        expect(sent.cmd).not.toMatch(/(^|; )exit /);
    });

    test("keeps the timeout between 1 second and the cap, the cap without one", async () => {
        expect((await call({ cmd: "ls" })).cmd).toStartWith(`timeout -k 5 ${max} `);
        expect((await call({ cmd: "ls", timeout: 0 })).cmd).toStartWith(`timeout -k 5 ${max} `);
        expect((await call({ cmd: "ls", timeout: 100000 })).cmd).toStartWith(`timeout -k 5 ${max} `);
        expect((await call({ cmd: "ls", timeout: 2.5 })).cmd).toStartWith(`timeout -k 5 3 `);
        expect(max * 1000).toBeLessThan(AppData.McpToolTimeoutMs);
    });

    test("tells the model how commands run", () => {
        expect(withCommandTimeout({ tool: echoTool("sandbox_execute_bash") }).description).toContain("reads no input");
    });

    test("leaves other tools alone", () => {
        const tool = echoTool("sandbox_execute_code");
        expect(withCommandTimeout({ tool })).toBe(tool);
    });
});
