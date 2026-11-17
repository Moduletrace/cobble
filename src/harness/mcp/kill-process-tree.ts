import { readFileSync } from "node:fs";

/**
 * Kills a stdio MCP server's shell and everything it started (M12). The
 * transport spawns a shell (`bash -c <command>`); killing only that pid
 * leaves the server it launched running. On Linux the whole descendant
 * tree is read from `/proc` and killed; elsewhere only the pid itself.
 * Only descendants of the given pid are touched, never the app's own
 * process group.
 */
export default function killProcessTree({ pid }: { pid: number }) {
    for (const target of descendants({ pid })) {
        try {
            process.kill(target, "SIGKILL");
        } catch {
            // Already gone.
        }
    }
}

function descendants({ pid }: { pid: number }): number[] {
    const found = [pid];
    const queue = [pid];

    while (queue.length) {
        const parent = queue.shift()!;
        let children: number[] = [];

        try {
            children = readFileSync(`/proc/${parent}/task/${parent}/children`, "utf8")
                .split(/\s+/)
                .filter(Boolean)
                .map(Number);
        } catch {
            continue;
        }

        for (const child of children) {
            found.push(child);
            queue.push(child);
        }
    }

    return found;
}
