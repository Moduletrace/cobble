import { AppData } from "@/src/data/app-data";
import type { ComputerCommandResult } from "@/src/functions/backend/computers/run-computer-command";
import withSshClient from "./with-ssh-client";
import type { SshTarget } from "@/src/functions/backend/db/computers/grab-computer-target";

type Params = {
    computer: {
        ssh: SshTarget;
        computer_id?: number;
    };
    command: string;
    timeout_ms: number | null;
    signal?: AbortSignal;
};

/**
 * Runs one shell command over SSH via an exec channel, combining stdout and
 * stderr. Handles timeout and abort signals, capping total output size.
 */
export default async function runSshCommand({
    computer,
    command,
    timeout_ms,
    signal,
}: Params): Promise<ComputerCommandResult> {
    return withSshClient({
        computer,
        signal,
        use: (client) =>
            new Promise<ComputerCommandResult>((resolve, reject) => {
                client.exec(command, (err, stream) => {
                    if (err) return reject(err);

                    let output = "";
                    let truncated = false;
                    let timedOut = false;
                    let timer: ReturnType<typeof setTimeout> | undefined;

                    const append = (data: Buffer | string) => {
                        const chunk = data.toString("utf8");
                        if (output.length + chunk.length > AppData.ComputerCommandMaxOutputChars) {
                            const remaining = AppData.ComputerCommandMaxOutputChars - output.length;
                            if (remaining > 0) output += chunk.slice(0, remaining);
                            truncated = true;
                        } else {
                            output += chunk;
                        }
                    };

                    stream.on("data", append);
                    stream.stderr?.on("data", append);

                    if (timeout_ms != null && timeout_ms > 0) {
                        timer = setTimeout(() => {
                            timedOut = true;
                            try {
                                stream.signal("TERM");
                            } catch {}
                            try {
                                stream.destroy();
                            } catch {}
                        }, timeout_ms);
                    }

                    const onAbort = () => {
                        if (timer) clearTimeout(timer);
                        try {
                            stream.destroy();
                        } catch {}
                        reject(new Error("Command aborted"));
                    };

                    signal?.addEventListener("abort", onAbort, { once: true });

                    stream.on("close", (code: number | null) => {
                        if (timer) clearTimeout(timer);
                        signal?.removeEventListener("abort", onAbort);
                        resolve({
                            output,
                            exit_code: typeof code === "number" ? code : null,
                            timed_out: timedOut,
                            truncated,
                        });
                    });
                });
            }),
    });
}
