import withSshClient from "./with-ssh-client";
import type { SshTarget } from "@/src/functions/backend/db/computers/grab-computer-target";

type Params = {
    computer: {
        ssh: SshTarget;
        computer_id?: number;
    };
    command: string;
    max_bytes: number;
    timeout_ms?: number | null;
    signal?: AbortSignal;
};

/**
 * Runs a command over SSH (such as tar -czf) and collects raw output as a Buffer,
 * capped at max_bytes.
 */
export default async function runSshCommandBytes({
    computer,
    command,
    max_bytes,
    timeout_ms,
    signal,
}: Params): Promise<{ bytes: Buffer; exit_code: number | null }> {
    return withSshClient({
        computer,
        signal,
        action: "run a command",
        use: (client) =>
            new Promise((resolve, reject) => {
                client.exec(command, (err, stream) => {
                    if (err) return reject(err);

                    const chunks: Buffer[] = [];
                    let totalBytes = 0;
                    let timer: ReturnType<typeof setTimeout> | undefined;

                    stream.on("data", (data: Buffer) => {
                        totalBytes += data.length;
                        if (totalBytes > max_bytes) {
                            try {
                                stream.destroy();
                            } catch {}
                            return reject(
                                new Error(`Command output exceeded limit of ${max_bytes} bytes`),
                            );
                        }
                        chunks.push(data);
                    });

                    if (timeout_ms != null && timeout_ms > 0) {
                        timer = setTimeout(() => {
                            try {
                                stream.destroy();
                            } catch {}
                            reject(new Error("Command timed out"));
                        }, timeout_ms);
                    }

                    stream.on("close", (code: number | null) => {
                        if (timer) clearTimeout(timer);
                        resolve({
                            bytes: Buffer.concat(chunks),
                            exit_code: typeof code === "number" ? code : null,
                        });
                    });
                });
            }),
    });
}
