import fs from "fs/promises";
import path from "path";
import runDockerContainer from "@/src/functions/backend/docker/run-docker-container";
import grabComputerImage from "@/src/functions/backend/docker/grab-computer-image";
import resolveHostPath from "@/src/functions/backend/docker/resolve-host-path";
import type { HostDirectoryMount } from "@/src/utils/host-directory-mount-plan";
import AppError from "@/src/utils/app-error";

type Params = {
    computer_dir: string;
    mounts: HostDirectoryMount[];
};

/**
 * Makes the folder each host directory is mounted at, before its container
 * is created: docker is told never to create a missing mount point itself,
 * since it would make it owned by root instead of failing.
 *
 * The folders under a bot's own folder and a workspace's belong to the
 * accounts on the computer, so an app running on the host as a plain user
 * can't make them (`EACCES`); those are made by a throwaway container as
 * root, over the computer's own folder. The container's root does the same
 * job the app does when it runs in docker, where it is root too.
 */
export default async function prepareHostDirectoryMounts({
    computer_dir,
    mounts,
}: Params) {
    const blocked: string[] = [];

    for (const mount of mounts) {
        try {
            await fs.mkdir(mount.destination, { recursive: true });
        } catch (error: unknown) {
            const code = (error as NodeJS.ErrnoException)?.code;

            if (code != "EACCES" && code != "EPERM") {
                throw error;
            }

            blocked.push(mount.destination);
        }
    }

    if (!blocked.length) return;

    const host_dir = await resolveHostPath({ local_path: computer_dir });
    const run = await runDockerContainer({
        image: await grabComputerImage(),
        entrypoint: ["/bin/sh", "-c"],
        cmd: [
            `mkdir -p "$@"`,
            "sh",
            ...blocked.map((destination) => `/computer/${path.relative(computer_dir, destination)}`),
        ],
        mounts: [{ source: host_dir, target: "/computer" }],
    });

    if (run.error || run.exit_code != 0) {
        throw new AppError(
            `Couldn't make the folder to mount a host directory at: ${run.error || run.logs || "the container failed."}`,
        );
    }
}