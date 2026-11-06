import { execFile } from "node:child_process";
import { chmod, chown, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { AgentConfig } from "./config";
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
 * other worker can read them; the coordinator, as gem, uses sudo.
 */
export default function ensureRunUser({ run_user }: { run_user: RunUser }) {
    const key = `${run_user.uid}:${run_user.workspace?.gid || 0}`;

    if (ready.has(key)) return Promise.resolve();

    const next = queue.then(async () => {
        if (ready.has(key)) return;

        await setUp({ run_user });
        ready.add(key);
    });

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
