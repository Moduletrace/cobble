import { Client } from "ssh2";
import { AppData } from "@/src/data/app-data";
import AppError from "@/src/utils/app-error";
import grabSshKey from "@/src/functions/backend/db/computers/grab-ssh-key";
import saveSshFingerprint from "@/src/functions/backend/db/computers/save-ssh-fingerprint";
import verifyHostFingerprint from "./verify-host-fingerprint";
import type { SshTarget } from "@/src/functions/backend/db/computers/grab-computer-target";

type Params = {
    computer: {
        ssh: SshTarget;
        computer_id?: number;
    };
    signal?: AbortSignal;
};

/**
 * Connects an ssh2.Client to the given SSH target with trust-on-first-use
 * host key verification and the install-wide private key.
 */
export default async function connectSsh({ computer, signal }: Params): Promise<Client> {
    const { ssh, computer_id } = computer;
    const stored = await grabSshKey();

    if (!stored?.private_key) {
        throw new AppError("No install SSH key found. Set up a key in Settings > Computers first.");
    }

    return new Promise<Client>((resolve, reject) => {
        if (signal?.aborted) {
            return reject(new Error("SSH connection aborted"));
        }

        const client = new Client();
        let seenFingerprint: string | null = null;
        let mismatch = "";
        let settled = false;

        const onAbort = () => {
            if (settled) return;
            settled = true;
            try {
                client.destroy();
            } catch {}
            reject(new Error("SSH connection aborted"));
        };

        signal?.addEventListener("abort", onAbort, { once: true });

        client.on("ready", () => {
            if (settled) return;
            settled = true;
            signal?.removeEventListener("abort", onAbort);

            // Persist learned fingerprint on trust on first use
            if (!ssh.fingerprint && seenFingerprint && computer_id) {
                void saveSshFingerprint({ computer_id, fingerprint: seenFingerprint }).catch(() => {});
            }

            resolve(client);
        });

        client.on("error", (err: Error) => {
            if (settled) return;
            settled = true;
            signal?.removeEventListener("abort", onAbort);
            try {
                client.destroy();
            } catch {}
            reject(new Error(mismatch || `Can't reach ${ssh.username}@${ssh.host}:${ssh.port}: ${err.message}`));
        });

        try {
            client.connect({
                host: ssh.host,
                port: ssh.port || 22,
                username: ssh.username,
                privateKey: stored.private_key,
                passphrase: stored.passphrase,
                readyTimeout: AppData.SshConnectTimeoutMs,
                keepaliveInterval: 15_000,
                hostHash: "sha256",
                hostVerifier: (hex: string) => {
                    seenFingerprint = hex;
                    const valid = verifyHostFingerprint({ expected: ssh.fingerprint, hex });
                    if (!valid) {
                        mismatch =
                            `Host key mismatch for ${ssh.username}@${ssh.host}:${ssh.port}. ` +
                            `Expected: ${ssh.fingerprint}, received: ${hex}. Use Forget fingerprint in settings if host changed.`;
                    }
                    return valid;
                },
            });
        } catch (error: any) {
            settled = true;
            signal?.removeEventListener("abort", onAbort);
            reject(new Error(`Can't connect to ${ssh.username}@${ssh.host}:${ssh.port}: ${error.message}`));
        }
    });
}
