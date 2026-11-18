import path from "node:path";
import { BotHookRunnerDir } from "@/src/dict/bot-hook-dict";
import AppError from "@/src/utils/app-error";
import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";

/**
 * Where a hook's runner state lives on the computer: a folder in the bot's
 * own, so it survives a recreated container, shows up in Files, and
 * belongs to the account the runner runs as (`BotHookRunnerDir`).
 */
export function hookRunnerBaseDir({ dirs }: { dirs: ComputerRunDirs }) {
    return path.posix.join(dirs.bot_dir, BotHookRunnerDir);
}

/**
 * One of a runner's files in that folder (`ensure.py`, `desired.json`,
 * `<id>.json`, `<id>.env.json`, `<id>.log`).
 */
export function hookRunnerFile({ dirs, file }: { dirs: ComputerRunDirs; file: string }) {
    return path.posix.join(hookRunnerBaseDir({ dirs }), file);
}

/**
 * The folder a runner starts in, checked against the bot's own: a
 * relative path inside it (empty is the bot's folder itself). A runner
 * works where its bot does, so an absolute path, a home-relative one or a
 * `..` that would climb out is refused rather than resolved.
 */
export default function hookRunnerDir({ dirs, runner_dir }: { dirs: ComputerRunDirs; runner_dir?: string | null }) {
    const raw = (runner_dir || "").trim().replaceAll("\\", "/");

    if (raw.includes("\0")) {
        throw new AppError(`A runner's folder can't hold a null byte.`);
    }

    if (raw.startsWith("/") || raw.startsWith("~")) {
        throw new AppError(`Give the runner's folder inside the bot's folder, relative: for example "whatsapp", not an absolute path.`);
    }

    const parts = raw.split("/").filter((part) => part && part != ".");

    if (parts.includes("..")) {
        throw new AppError(`The runner's folder has to stay inside the bot's folder.`);
    }

    return parts.length ? path.posix.join(dirs.bot_dir, ...parts) : dirs.bot_dir;
}