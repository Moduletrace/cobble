/**
 * What `collectComputerDownloads` found in the browser's download folder:
 * files moved into the run's folders, and names still downloading.
 */
export type CollectedDownloads = {
    moved: { name: string; path: string }[];
    pending: string[];
};

/**
 * Reads the lines the collecting command prints (`moved\t<name>\t<path>`,
 * `pending\t<name>`), ignoring anything else.
 */
export default function parseCollectedDownloads({ output }: { output: string }): CollectedDownloads {
    const collected: CollectedDownloads = { moved: [], pending: [] };

    for (const line of output.split("\n")) {
        const [kind, name, path] = line.split("\t");

        if (kind == "moved" && name && path) collected.moved.push({ name, path });
        if (kind == "pending" && name) collected.pending.push(name);
    }

    return collected;
}
