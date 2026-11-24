import { Monitor, Server } from "lucide-react";

/**
 * A computer's icon: a monitor for the sandboxed container this app makes
 * (a screen and a shell of its own), a server for a remote machine reached
 * over SSH, which has no screen here.
 */
export default function computerIcon({
    connection,
}: {
    connection?: string | null;
}) {
    return connection == "ssh" ? Server : Monitor;
}