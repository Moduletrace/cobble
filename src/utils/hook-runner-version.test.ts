import { describe, expect, test } from "bun:test";
import hookRunnerVersion from "./hook-runner-version";

const envs: { key: string; value: string }[] = [
    { key: "WHATSAPP_TOKEN", value: "one" },
    { key: "COBBLE_DATABASE", value: "two" },
];

const base = {
    script_version: "1",
    command: "python3 whatsapp-bridge.py",
    dir: "/home/gem/workspace/bots/3/whatsapp",
    computer_id: 2,
    workspace_id: null,
    envs,
};

/**
 * The digest is what decides whether a runner is left alone or restarted,
 * so it must change for everything the process was started with, and for
 * nothing else (a reordered env list is not a change).
 */
describe("hookRunnerVersion", () => {
    test("is a short hex digest", () => {
        expect(hookRunnerVersion(base)).toMatch(/^[0-9a-f]{32}$/);
    });

    test("is the same for the same setup, whatever the env order or spacing", () => {
        const reordered = {
            ...base,
            command: `  ${base.command}  `,
            envs: [envs[1]!, envs[0]!],
        };

        expect(hookRunnerVersion(reordered)).toBe(hookRunnerVersion(base));
    });

    test("changes with the command, folder, computer, workspace or script", () => {
        const digest = hookRunnerVersion(base);

        expect(hookRunnerVersion({ ...base, command: "node bridge.js" })).not.toBe(digest);
        expect(hookRunnerVersion({ ...base, dir: "/home/gem/workspace/bots/3" })).not.toBe(digest);
        expect(hookRunnerVersion({ ...base, computer_id: 3 })).not.toBe(digest);
        expect(hookRunnerVersion({ ...base, workspace_id: 4 })).not.toBe(digest);
        expect(hookRunnerVersion({ ...base, script_version: "2" })).not.toBe(digest);
    });

    test("changes when an env is added, removed or changed", () => {
        const digest = hookRunnerVersion(base);

        expect(hookRunnerVersion({ ...base, envs: [...base.envs, { key: "NEW", value: "" }] })).not.toBe(digest);
        expect(hookRunnerVersion({ ...base, envs: [envs[0]!] })).not.toBe(digest);
        expect(
            hookRunnerVersion({ ...base, envs: [envs[0]!, { key: "COBBLE_DATABASE", value: "three" }] }),
        ).not.toBe(digest);
    });

    test("never carries an env value out of it", () => {
        expect(hookRunnerVersion(base)).not.toContain("one");
        expect(hookRunnerVersion(base)).not.toContain("two");
    });
});