import type { Client } from "ssh2";
import connectSsh from "./connect-ssh";
import sshOperationError from "./ssh-operation-error";
import type { SshTarget } from "@/src/functions/backend/db/computers/grab-computer-target";

type Params<T> = {
    computer: {
        ssh: SshTarget;
        computer_id?: number;
    };
    signal?: AbortSignal;
    /**
     * What the callback is doing, for the message when it fails ("read
     * /home/cobble/.bashrc"); ssh2's own message is often just "Failure".
     */
    action: string;
    use: (client: Client) => Promise<T>;
};

/**
 * Connects to an SSH computer, invokes the callback, and ensures the client
 * socket is closed in a finally block so connections are never leaked.
 */
export default async function withSshClient<T>({ computer, signal, action, use }: Params<T>): Promise<T> {
    const client = await connectSsh({ computer, signal });
    try {
        return await use(client);
    } catch (error) {
        throw sshOperationError({ ssh: computer.ssh, action, error });
    } finally {
        try {
            client.end();
        } catch {
            try {
                client.destroy();
            } catch {}
        }
    }
}
