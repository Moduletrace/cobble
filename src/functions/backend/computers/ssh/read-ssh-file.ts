import withSshClient from "./with-ssh-client";
import type { SshTarget } from "@/src/functions/backend/db/computers/grab-computer-target";
import type { ComputerDownload } from "@/src/functions/backend/computers/download-computer-file";

type Params = {
    computer: {
        ssh: SshTarget;
        computer_id?: number;
    };
    path: string;
    max_bytes: number;
    signal?: AbortSignal;
};

/**
 * Reads a file from an SSH server via SFTP, enforcing size limits and existence checks.
 */
export default async function readSshFile({
    computer,
    path,
    max_bytes,
    signal,
}: Params): Promise<ComputerDownload> {
    return withSshClient({
        computer,
        signal,
        use: (client) =>
            new Promise<ComputerDownload>((resolve, reject) => {
                client.sftp((err, sftp) => {
                    if (err) return reject(err);

                    sftp.stat(path, (statErr, stats) => {
                        if (statErr) {
                            if ((statErr as any).code === 2 || (statErr as any).code === "ENOENT") {
                                return resolve({ ok: false, reason: "missing", size: 0 });
                            }
                            return reject(statErr);
                        }

                        if (!stats.isFile()) {
                            return resolve({ ok: false, reason: "missing", size: 0 });
                        }

                        if (stats.size > max_bytes) {
                            return resolve({ ok: false, reason: "too_big", size: stats.size });
                        }

                        sftp.readFile(path, (readErr, buffer) => {
                            if (readErr) {
                                if ((readErr as any).code === 2 || (readErr as any).code === "ENOENT") {
                                    return resolve({ ok: false, reason: "missing", size: 0 });
                                }
                                return reject(readErr);
                            }

                            if (buffer.length !== stats.size) {
                                return resolve({ ok: false, reason: "cut_short", size: buffer.length });
                            }

                            resolve({ ok: true, bytes: buffer, size: buffer.length });
                        });
                    });
                });
            }),
    });
}