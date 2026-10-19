import { useEffect, useRef } from "react";
import type { WebSocketDataType } from "@/src/types";

type Params = {
    event: WebSocketDataType["event"];
    onData: (data: any) => void;
};

/**
 * Calls `onData` with the payload of every `event` pushed over the
 * WebSocket. The socket itself is opened once, by the bots layout (twui
 * `useWebSocket`, which re-dispatches each message as `wsDataEvent`).
 */
export default function useServerEvent({ event, onData }: Params) {
    const handler = useRef(onData);
    handler.current = onData;

    useEffect(() => {
        const listener = (e: Event) => {
            const data = (e as CustomEvent<{ data?: WebSocketDataType }>).detail?.data;

            if (data?.event == event) handler.current(data.data);
        };

        window.addEventListener("wsDataEvent", listener);

        return () => window.removeEventListener("wsDataEvent", listener);
    }, [event]);
}
