import { describe, expect, test } from "bun:test";
import { BotHookRunnerDir } from "@/src/dict/bot-hook-dict";
import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import hookRunnerDir, { hookRunnerBaseDir, hookRunnerFile } from "./hook-runner-paths";

const dirs = {
    bot_dir: "/home/gem/workspace/bots/3",
    cwd: "/home/gem/workspace/bots/3/users/1",
    workspace: "/home/gem/workspace",
    shared_dir: "/home/gem/workspace/workspaces/2",
    roots: ["/home/gem/workspace/bots/3", "/home/gem/workspace/users/1"],
    user_id: 1,
    run_as: null,
} as unknown as ComputerRunDirs;

/**
 * A runner starts inside its bot's folder and its state sits in that
 * folder's own hidden one (`BotHookRunnerDir`), which is what lets it
 * survive a recreated container.
 */
describe("hookRunnerBaseDir", () => {
    test("is the bot folder's own hidden folder", () => {
        expect(hookRunnerBaseDir({ dirs })).toBe(`/home/gem/workspace/bots/3/${BotHookRunnerDir}`);
    });

    test("names one file inside it", () => {
        expect(hookRunnerFile({ dirs, file: "desired.json" })).toBe(
            `/home/gem/workspace/bots/3/${BotHookRunnerDir}/desired.json`,
        );
    });
});

describe("hookRunnerDir", () => {
    test("empty means the bot's own folder", () => {
        expect(hookRunnerDir({ dirs })).toBe(dirs.bot_dir);
        expect(hookRunnerDir({ dirs, runner_dir: "" })).toBe(dirs.bot_dir);
        expect(hookRunnerDir({ dirs, runner_dir: "   " })).toBe(dirs.bot_dir);
        expect(hookRunnerDir({ dirs, runner_dir: null })).toBe(dirs.bot_dir);
    });

    test("a relative folder is inside the bot's folder", () => {
        expect(hookRunnerDir({ dirs, runner_dir: "whatsapp" })).toBe("/home/gem/workspace/bots/3/whatsapp");
        expect(hookRunnerDir({ dirs, runner_dir: "bridge/whatsapp" })).toBe(
            "/home/gem/workspace/bots/3/bridge/whatsapp",
        );
        expect(hookRunnerDir({ dirs, runner_dir: "./whatsapp/" })).toBe("/home/gem/workspace/bots/3/whatsapp");
    });

    test("refuses an absolute, a home-relative or a climbing path", () => {
        expect(() => hookRunnerDir({ dirs, runner_dir: "/home/gem/workspace/bots/3/whatsapp" })).toThrow(
            "not an absolute path",
        );
        expect(() => hookRunnerDir({ dirs, runner_dir: "~/whatsapp" })).toThrow("not an absolute path");
        expect(() => hookRunnerDir({ dirs, runner_dir: ".." })).toThrow("has to stay inside the bot's folder");
        expect(() => hookRunnerDir({ dirs, runner_dir: "whatsapp/../../other" })).toThrow(
            "has to stay inside the bot's folder",
        );
    });

    test("a Windows separator is read as a folder separator, not a way out", () => {
        expect(hookRunnerDir({ dirs, runner_dir: "bridge\\whatsapp" })).toBe(
            "/home/gem/workspace/bots/3/bridge/whatsapp",
        );
        expect(() => hookRunnerDir({ dirs, runner_dir: "..\\..\\other" })).toThrow(
            "has to stay inside the bot's folder",
        );
    });

    test("refuses a null byte", () => {
        expect(() => hookRunnerDir({ dirs, runner_dir: "whats\0app" })).toThrow("null byte");
    });
});