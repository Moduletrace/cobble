import { execFile } from "node:child_process";
import { chmod, chown, lstat, mkdir, readlink, rename, stat, symlink, unlink } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { AgentConfig } from "./config";
import commandArgv from "./command-argv";
import log from "./log";
import type { RunUser } from "./run-user-for";

const run = promisify(execFile);

/**
 * Accounts already set up since the agent started. They live in the
 * container, so a recreated one starts with none and they're made again.
 */
const ready = new Set<string>();

let queue: Promise<unknown> = Promise.resolve();

/**
 * Makes a worker's account and, in a workspace, its group (idempotent,
 * one at a time), and hands it its folders: its home (private), the bot's
 * folder (its own) and the workspace's (its group's). Neither gem nor any
 * other worker can read them; the coordinator, as gem, uses sudo. Then,
 * on every call, makes sure of the links the worker works through
 * (`keepLinks`): only the bot's folder is kept, so a write through a link
 * that's gone would land somewhere a recreate wipes.
 */
export default async function ensureRunUser({ run_user }: { run_user: RunUser }) {
    const key = `${run_user.uid}:${run_user.workspace?.gid || 0}`;

    if (!ready.has(key)) {
        await serially(async () => {
            if (ready.has(key)) return;

            await setUp({ run_user });
            ready.add(key);
        });
    }

    if (!(await linksInPlace({ run_user }))) await serially(() => keepLinks({ run_user }));
}

function serially(work: () => Promise<void>) {
    const next = queue.then(work);

    queue = next.catch(() => {});

    return next;
}

async function setUp({ run_user }: { run_user: RunUser }) {
    const { name, uid, gid, home, workspace } = run_user;

    if (!(await exists({ db: "group", key: name }))) await run("groupadd", ["-g", String(gid), name]);

    if (!(await exists({ db: "passwd", key: name }))) {
        await run("useradd", ["-l", "-M", "-u", String(uid), "-g", String(gid), "-d", home, "-s", "/bin/bash", name]);
    }

    if (workspace) {
        if (!(await exists({ db: "group", key: workspace.name }))) {
            await run("groupadd", ["-g", String(workspace.gid), workspace.name]);
        }

        const { stdout } = await run("id", ["-nG", name]);

        if (!stdout.split(/\s+/).includes(workspace.name)) await run("usermod", ["-aG", workspace.name, name]);
    }

    for (const dir of [home, path.posix.join(home, ".cobble")]) {
        await mkdir(dir, { recursive: true });
        await chown(dir, uid, gid);
        await chmod(dir, 0o700);
    }

    await shareFolder({ dir: run_user.bot_dir, uid, gid });

    /**
     * Root owns a workspace's folder (no worker can change its mode), its
     * bots share it through the group.
     */
    if (workspace) await shareFolder({ dir: workspace.dir, uid: 0, gid: workspace.gid });

    await keepLinks({ run_user });
}

/**
 * Whether the worker's links lead where they should: `workspace` in its
 * home to the bot's folder, and in a workspace, `workspaces/<id>` in the
 * bot's folder to the workspace's shared one. Only reads.
 */
async function linksInPlace({ run_user }: { run_user: RunUser }) {
    if (!(await isLinkTo({ link: run_user.kept_dir, target: run_user.bot_dir }))) return false;

    return !run_user.workspace || isLinkTo({ link: run_user.workspace.link, target: run_user.workspace.dir });
}

async function isLinkTo({ link, target }: { link: string; target: string }) {
    const info = await lstat(link).catch(() => null);

    return !!info?.isSymbolicLink() && (await readlink(link).catch(() => "")) == target;
}

/**
 * Puts the worker's links back where they're missing or lead elsewhere.
 * Whatever else sits in a link's place is moved aside, never deleted.
 * The home's link is made as root (the home is a real folder in root's
 * /home, so nothing in its path is the worker's to swap); the shared
 * folder's, inside the bot's folder (the worker's own), by the worker's
 * account, so a link it left there can't send root anywhere.
 */
async function keepLinks({ run_user }: { run_user: RunUser }) {
    const { kept_dir, bot_dir, workspace } = run_user;

    if (!(await isLinkTo({ link: kept_dir, target: bot_dir }))) {
        const info = await lstat(kept_dir).catch(() => null);

        if (info?.isSymbolicLink()) await unlink(kept_dir);
        else if (info) await rename(kept_dir, `${kept_dir}.before-${Date.now()}`);

        await symlink(bot_dir, kept_dir);
    }

    if (workspace && !(await isLinkTo({ link: workspace.link, target: workspace.dir }))) {
        const link = quoted({ text: workspace.link });
        const target = quoted({ text: workspace.dir });
        const argv = commandArgv({
            command: [
                `umask 007`,
                `mkdir -p "$(dirname ${link})"`,
                `if [ -L ${link} ]; then ln -sfn ${target} ${link}; elif [ -e ${link} ]; then mv ${link} ${link}.before-$(date +%s) && ln -s ${target} ${link}; else ln -s ${target} ${link}; fi`,
            ].join(" && "),
            as: { uid: run_user.uid, gid: run_user.gid },
        });

        await run(argv.file, argv.args, { cwd: "/", timeout: 30_000 });
    }
}

function quoted({ text }: { text: string }) {
    return `'${text.replaceAll("'", `'\\''`)}'`;
}

/**
 * Gives a folder to its owner and group (`2770`: new files keep the
 * group), with default ACLs so what's made inside stays open to the group
 * (a workspace's bots) and closed to everyone else. gem gets no way in:
 * Chrome runs as gem, and a page a worker opened could otherwise show
 * another bot's files. Walked whole only while the folder isn't its
 * owner's yet (files from before accounts were gem's). Links inside are
 * never followed.
 */
async function shareFolder({ dir, uid, gid }: { dir: string; uid: number; gid: number }) {
    await makeParents({ dir });
    await mkdir(dir, { recursive: true });

    const info = await stat(dir);

    /**
     * Already handed over: only its own mode is put back (its owner may
     * have changed it), never walked again, so a worker can't have root
     * walk a tree it keeps changing.
     */
    if (info.uid == uid && info.gid == gid) {
        if ((info.mode & 0o7777) != 0o2770) await chmod(dir, 0o2770);
        return;
    }

    await run("chown", ["-R", "-P", `${uid}:${gid}`, dir]);
    await run("chmod", ["-R", "u+rwX,g+rwX,o-rwx", dir]);
    await run("find", [dir, "-type", "d", "-exec", "chmod", "g+s", "{}", "+"]);
    await run("find", [dir, "-type", "d", "-exec", "setfacl", "-m", "d:u::rwX,d:g::rwX,d:o::---", "{}", "+"]).catch((error) => {
        log({ name: "agent", message: `couldn't set default ACLs on ${dir}: ${error?.stderr || error?.message || error}` });
    });

    await chmod(dir, 0o2770);
}

/**
 * `bots/` and `workspaces/` themselves stay gem's and open to all, so a
 * worker can walk to its own folder.
 */
async function makeParents({ dir }: { dir: string }) {
    const parent = path.posix.dirname(dir);
    const created = await mkdir(parent, { recursive: true });

    if (created) {
        await chown(parent, AgentConfig.Uid, AgentConfig.Gid);
        await chmod(parent, 0o755);
    }
}

async function exists({ db, key }: { db: "group" | "passwd"; key: string }) {
    return run("getent", [db, key]).then(
        () => true,
        () => false,
    );
}
