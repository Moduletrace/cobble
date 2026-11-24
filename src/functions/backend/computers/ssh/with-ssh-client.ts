import type { Client } from "ssh2";
import connectSsh from "./connect-ssh";
import type { SshTarget } from "@/src/functions/backend/db/computers/grab-computer-target";

type Params<T> = {
    computer: {
        ssh: SshTarget;
        computer_id?: number;
    };
    signal?: AbortSignal;
    use: (client: Client) => Promise<T>;
};

/**
 * Connects to an SSH computer, invokes the callback, and ensures the client
 * socket is closed in a finally block so connections are never leaked.
 */
export default async function withSshClient<T>({ computer, signal, use }: Params<T>): Promise<T> {
    const client = await connectSsh({ computer, signal });
    try {
        return await use(client);
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
