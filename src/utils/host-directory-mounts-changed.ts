import type { HostDirectoryMount } from "./host-directory-mount-plan";

type Params = {
    /**
     * What the container was made with (`metadata.host_mounts`), as
     * `source:target:access` entries.
     */
    stored?: string[] | null;
    mounts: HostDirectoryMount[];
};

/**
 * How a mount is written in a container's `metadata.host_mounts`: its
 * source, where it is and how it may be used. Read-only or read-write is
 * part of it, since it is the mount itself that decides.
 */
export function hostDirectoryMountEntry({ mount }: { mount: HostDirectoryMount }) {
    return `${mount.source}:${mount.target}:${mount.access}`;
}

/**
 * Whether a container was made with another set of host directories than
 * it should have now, so it has to be recreated (a mount only exists from
 * the container's creation): one added, removed, or linked read only
 * instead of read and write.
 */
export default function hostDirectoryMountsChanged({ stored, mounts }: Params) {
    const before = [...(stored || [])].sort();
    const after = mounts.map((mount) => hostDirectoryMountEntry({ mount })).sort();

    return before.length != after.length || after.some((entry, index) => entry != before[index]);
}