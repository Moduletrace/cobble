import withSshClient from "./with-ssh-client";
import type { SshTarget } from "@/src/functions/backend/db/computers/grab-computer-target";
import type { ComputerFileStat } from "@/src/functions/backend/computers/stat-computer-file";

type Params = {
    computer: {
        ssh: SshTarget;
        computer_id?: number;
    };
    path: string;
    signal?: AbortSignal;
};

/**
 * Checks a file or directory at an absolute path on an SSH server via SFTP stat.
 */
export default async function statSshFile({
    computer,
    path,
    signal,
}: Params): Promise<ComputerFileStat> {
    return withSshClient({
        computer,
        signal,
        use: (client) =>
            new Promise<ComputerFileStat>((resolve, reject) => {
                client.sftp((err, sftp) => {
                    if (err) return reject(err);

                    sftp.stat(path, (statErr, stats) => {
                        if (statErr) {
                            if ((statErr as any).code === 2 || (statErr as any).code === "ENOENT") {
                                return resolve({ exists: false });
                            }
                            return reject(statErr);
                        }

                        const type = stats.isDirectory()
                            ? "directory"
                            : stats.isFile()
                              ? "file"
                              : "other";

                        resolve({
                            exists: true,
                            type,
                            size: stats.size,
                            mtime_ms: stats.mtime * 1000,
                        });
                    });
                });
            }),
    });
}
