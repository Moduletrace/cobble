import { useRef, useState } from "react";
import stopBot from "../(functions)/stop-bot";

export type StopBot = {
    /**
     * Stops every job of the bot for the signed-in user.
     */
    stop: () => Promise<void>;
    /**
     * A stop is on its way to the server.
     */
    stopping: boolean;
    /**
     * Why the last stop didn't work, for the button's title.
     */
    error?: string;
};

type Params = {
    bot_id: number;
    workspace_id?: number | null;
};

/**
 * The conversation's stop button: pulls the plug on the bot for the
 * signed-in user, wherever they chat with it. It's quiet on the way out:
 * the bot's closing message and idle face arrive as pushes, so nothing
 * here reloads and a failed stop only surfaces as the button's title.
 */
export default function useStopBot({ bot_id, workspace_id }: Params): StopBot {
    const [stopping, setStopping] = useState(false);
    const [error, setError] = useState<string>();

    /**
     * A ref, not the state: two clicks in one tick both read the old
     * `stopping` and would send two stops.
     */
    const in_flight = useRef(false);

    const stop = async () => {
        if (in_flight.current) return;

        in_flight.current = true;
        setStopping(true);
        setError(undefined);

        try {
            const res = await stopBot({
                bot_id,
                workspace_id: workspace_id || null,
            }).catch(() => null);

            /**
             * A message without a failure is the count ("Stopped 2 jobs."),
             * so only an unsuccessful answer is an error.
             */
            if (!res?.success) setError(res?.msg || "Couldn't stop the bot.");
        } finally {
            in_flight.current = false;
            setStopping(false);
        }
    };

    return { stop, stopping, error };
}
