import type { ServerWebSocket } from "bun";
import type { Client, ClientChannel } from "ssh2";
import connectSsh from "@/src/functions/backend/computers/ssh/connect-ssh";
import grabComputerTarget from "@/src/functions/backend/db/computers/grab-computer-target";
import type { WebSocketSession } from "@/src/websocket/types";

type Live = {
    client: Client;
    stream?: ClientChannel;
};

type TerminalMessage = {
    type?: string;
    data?: string;
    cols?: number;
    rows?: number;
};

/**
 * The SSH clients behind open terminal sockets (`ssh_terminal`), so the
 * browser's keystrokes reach the shell and closing the page ends it.
 */
const live = new WeakMap<ServerWebSocket<WebSocketSession>, Live>();

function send(ws: ServerWebSocket<WebSocketSession>, message: TerminalMessage | { type: string; message: string }) {
    try {
        ws.send(JSON.stringify(message));
    } catch {}
}

/**
 * A terminal socket (`/computers/<id>/ssh-terminal`): one shell on the
 * computer, its output as `data` frames, its input the browser's.
 */
export const sshTerminalSocket = {
    async open(ws: ServerWebSocket<WebSocketSession>) {
        const computer_id = ws.data.ssh_terminal?.computer_id;

        if (!computer_id) {
            send(ws, { type: "error", message: "No computer for this terminal." });
            ws.close();
            return;
        }

        try {
            const target = await grabComputerTarget({ computer_id });

            if (!target?.ready || target.connection != "ssh") {
                throw new Error("This computer is not reachable over SSH.");
            }

            const client = await connectSsh({ computer: { ssh: target.ssh, computer_id } });

            if (ws.readyState !== WebSocket.OPEN) {
                client.end();
                return;
            }

            const entry: Live = { client };

            live.set(ws, entry);

            client.shell({ term: "xterm-256color", cols: 80, rows: 24 }, (error, stream) => {
                if (error) {
                    send(ws, { type: "error", message: error.message });
                    ws.close();
                    return;
                }

                entry.stream = stream;
                send(ws, { type: "ready" });
                stream.on("data", (chunk: Buffer) =>
                    send(ws, { type: "data", data: chunk.toString("utf8") }),
                );
                stream.stderr.on("data", (chunk: Buffer) =>
                    send(ws, { type: "data", data: chunk.toString("utf8") }),
                );
                stream.on("close", () => {
                    try {
                        ws.close();
                    } catch {}
                });
            });

            client.on("close", () => {
                try {
                    ws.close();
                } catch {}
            });
        } catch (error: any) {
            send(ws, { type: "error", message: error?.message || "The SSH connection failed." });
            ws.close();
        }
    },

    message(ws: ServerWebSocket<WebSocketSession>, message: string | Buffer) {
        const stream = live.get(ws)?.stream;

        if (!stream) return;

        let parsed: TerminalMessage;

        try {
            parsed = JSON.parse(message.toString()) as TerminalMessage;
        } catch {
            return;
        }

        if (parsed.type == "data" && typeof parsed.data == "string") {
            stream.write(parsed.data);
        } else if (parsed.type == "resize" && parsed.cols && parsed.rows) {
            stream.setWindow(parsed.rows, parsed.cols, 0, 0);
        }
    },

    close(ws: ServerWebSocket<WebSocketSession>) {
        const entry = live.get(ws);

        live.delete(ws);

        try {
            entry?.stream?.close();
        } catch {}

        try {
            entry?.client.end();
        } catch {
            try {
                entry?.client.destroy();
            } catch {}
        }
    },
};