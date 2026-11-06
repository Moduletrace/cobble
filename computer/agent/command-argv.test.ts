import { describe, expect, test } from "bun:test";
import commandArgv from "./command-argv";

describe("commandArgv", () => {
    test("bash -c on its own", () => {
        expect(commandArgv({ command: "ls -la" })).toEqual({ file: "bash", args: ["-c", "ls -la"] });
    });

    test("through setpriv as another account, with its groups", () => {
        expect(commandArgv({ command: "id", as: { uid: 100_007, gid: 100_007 } })).toEqual({
            file: "setpriv",
            args: ["--reuid", "100007", "--regid", "100007", "--init-groups", "--", "bash", "-c", "id"],
        });
    });
});
