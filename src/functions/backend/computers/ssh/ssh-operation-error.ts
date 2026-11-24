import AppError from "@/src/utils/app-error";
import type { SshTarget } from "@/src/functions/backend/db/computers/grab-computer-target";

type Params = {
    ssh: SshTarget;
    /**
     * What the app was doing, e.g. "read /home/cobble/.bashrc".
     */
    action: string;
    error: unknown;
};

/**
 * ssh2 reports an SFTP failure as the bare status text ("Failure"), which
 * says nothing about where or what, and that is what the thread showed the
 * user. Name the server and the step instead.
 */
export default function sshOperationError({ ssh, action, error }: Params): AppError {
    if (error instanceof AppError) return error;

    const message = error instanceof Error ? error.message : String(error);

    return new AppError(
        `Couldn't ${action} on ${ssh.username}@${ssh.host}:${ssh.port}: ${message || "no reason given"}`,
    );
}