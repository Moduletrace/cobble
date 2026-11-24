import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import P from "@moduletrace/twui/layout/P";
import Stack from "@moduletrace/twui/layout/Stack";

type Props = {
    computer_id: number;
    /**
     * The computer's name, for the terminal's label.
     */
    name: string;
    className?: string;
};

type TerminalMessage = {
    type?: string;
    data?: string;
    message?: string;
    cols?: number;
    rows?: number;
};

/**
 * A computer's shell in the app (`/computers/<id>/ssh-terminal`): xterm
 * over a websocket the server bridges to the SSH session.
 */
export default function SshTerminal({ computer_id, name, className }: Props) {
    const host = useRef<HTMLDivElement>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const element = host.current;

        if (!element) return;

        const term = new Terminal({ cursorBlink: true, fontSize: 13 });
        const fit = new FitAddon();

        term.loadAddon(fit);
        term.open(element);
        fit.fit();

        const protocol = location.protocol == "https:" ? "wss:" : "ws:";
        const socket = new WebSocket(
            `${protocol}//${location.host}/computers/${computer_id}/ssh-terminal`,
        );

        const send = (message: TerminalMessage) => {
            if (socket.readyState == WebSocket.OPEN) socket.send(JSON.stringify(message));
        };

        socket.onopen = () => send({ type: "resize", cols: term.cols, rows: term.rows });

        socket.onmessage = (event) => {
            let message: TerminalMessage;

            try {
                message = JSON.parse(String(event.data)) as TerminalMessage;
            } catch {
                return;
            }

            if (message.type == "data" && typeof message.data == "string") {
                term.write(message.data);
            } else if (message.type == "ready") {
                fit.fit();
                send({ type: "resize", cols: term.cols, rows: term.rows });
            } else if (message.type == "error") {
                setError(message.message || "The connection failed.");
            }
        };

        socket.onclose = () => setError((prev) => prev || "The connection closed.");

        const data = term.onData((text) => send({ type: "data", data: text }));
        const resize = term.onResize(({ cols, rows }) => send({ type: "resize", cols, rows }));
        const observer = new ResizeObserver(() => fit.fit());

        observer.observe(element);
        term.focus();
        void document.fonts.ready.then(() => fit.fit());

        return () => {
            observer.disconnect();
            data.dispose();
            resize.dispose();
            socket.close();
            term.dispose();
        };
    }, [computer_id]);

    return (
        <Stack className={twMerge("h-full min-h-0 w-full gap-0!", className)}>
            {/* xterm mounts into a plain node of its own; it is not layout. */}
            <div ref={host} className="h-full w-full" aria-label={`${name} terminal`} />
            {error ? (
                <P className="px-2 py-1 text-small text-ink-secondary">{error}</P>
            ) : null}
        </Stack>
    );
}