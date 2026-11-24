import path from "node:path";
import withSshClient from "./with-ssh-client";
import replaceSshFile from "./replace-ssh-file";
import runSshCommand from "./run-ssh-command";
import shellQuote from "@/src/utils/shell-quote";
import type { SshTarget } from "@/src/functions/backend/db/computers/grab-computer-target";

type Params = {
    computer: {
        ssh: SshTarget;
        computer_id?: number;
    };
    path: string;
    content: string | Buffer;
    mode?: number;
    signal?: AbortSignal;
};

/**
 * Writes a file to an SSH server via SFTP, ensuring parent directories exist
 * (via mkdir -p) and performing an atomic rename.
 */
export default async function writeSshFile({
    computer,
    path: filePath,
    content,
    mode,
    signal,
}: Params): Promise<{ ok: boolean; size: number }> {
    const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
    const parentDir = path.posix.dirname(filePath);

    if (parentDir && parentDir !== "." && parentDir !== "/") {
        await runSshCommand({
            computer,
            command: `mkdir -p -- ${shellQuote({ text: parentDir })}`,
            timeout_ms: 15_000,
            signal,
        });
    }

    const tmpPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;

    return withSshClient({
        computer,
        signal,
        action: `write ${filePath}`,
        use: (client) =>
            new Promise<{ ok: boolean; size: number }>((resolve, reject) => {
                client.sftp((err, sftp) => {
                    if (err) return reject(err);

                    const fail = (error: Error) => sftp.unlink(tmpPath, () => reject(error));

                    sftp.writeFile(tmpPath, bytes, (writeErr) => {
                        if (writeErr) return fail(writeErr);

                        const finalize = () =>
                            replaceSshFile({ sftp, from: tmpPath, to: filePath }).then(
                                () => resolve({ ok: true, size: bytes.length }),
                                fail,
                            );

                        if (mode != null) {
                            sftp.chmod(tmpPath, mode, (chmodErr) => {
                                if (chmodErr) return fail(chmodErr);
                                finalize();
                            });
                        } else {
                            finalize();
                        }
                    });
                });
            }),
    });
}
