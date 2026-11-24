import saveSshHome from "@/src/functions/backend/db/computers/save-ssh-home";
import type { SshTarget } from "@/src/functions/backend/db/computers/grab-computer-target";
import AppError from "@/src/utils/app-error";
import runSshCommand from "./run-ssh-command";

type Params = {
    computer: {
        ssh: SshTarget;
        computer_id?: number;
    };
    signal?: AbortSignal;
};

/**
 * The SSH user's home directory: the one learned before, or the one the
 * server reports, saved for next time. SFTP doesn't expand `~`, so every
 * path on an SSH computer is built from this.
 */
export default async function ensureSshHome({ computer, signal }: Params): Promise<string> {
    if (computer.ssh.home) return computer.ssh.home;

    const result = await runSshCommand({
        computer,
        command: 'printf %s "$HOME"',
        timeout_ms: 10_000,
        signal,
    });
    const home = result.output.trim();

    if (!home.startsWith("/")) {
        throw new AppError(`Couldn't find your home directory on ${computer.ssh.username}@${computer.ssh.host}.`);
    }

    computer.ssh.home = home;

    if (computer.computer_id) {
        void saveSshHome({ computer_id: computer.computer_id, home }).catch(() => {});
    }

    return home;
}