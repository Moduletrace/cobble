import { readFile } from "node:fs/promises";

/**
 * Mount point paths inside a folder, deepest irrelevant: a host folder is
 * bind-mounted in a bot's folder (or a workspace's), and walking that
 * folder must stop at it. `find -xdev` alone isn't enough, since the mount
 * point directory itself still counts as visited and would be chowned or
 * chmoded through the bind, changing the folder on the host machine.
 */
export default async function mountPointsUnder({ dir }: { dir: string }) {
    const text = await readFile("/proc/self/mountinfo", "utf8").catch(() => "");
    const prefix = dir.endsWith("/") ? dir : `${dir}/`;

    return text.split("\n").flatMap((line) => {
        const field = line.split(" ")[4];
        const mount_point = unescape({ text: field || "" });

        if (!mount_point.startsWith(prefix)) return [];

        return [mount_point];
    });
}

const Escapes: Record<string, string> = {
    "040": " ",
    "011": "\t",
    "012": "\n",
    "134": "\\",
};

/** mountinfo writes a path's spaces and friends octal-escaped. */
function unescape({ text }: { text: string }) {
    return text.replace(/\\([0-7]{3})/g, (match, code: string) => Escapes[code] ?? match);
}