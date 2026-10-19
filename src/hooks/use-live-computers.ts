import { useState } from "react";
import useServerEvent from "@/src/hooks/use-server-event";
import type { ComputerWithStatus } from "@/src/types";

type Params = {
    computers: ComputerWithStatus[];
    /**
     * Also add computers the list doesn't have yet (one just created), for
     * a list of every computer the user has.
     */
    include_new?: boolean;
};

/**
 * A list of computers kept current from `server:computer-updated` (setup
 * finishing or failing, a container stopping).
 */
export default function useLiveComputers({ computers: initial, include_new }: Params) {
    const [computers, setComputers] = useState(initial);

    useServerEvent({
        event: "server:computer-updated",
        onData: (computer: ComputerWithStatus) =>
            setComputers((prev) =>
                prev.some((c) => c.id == computer.id)
                    ? prev.map((c) => (c.id == computer.id ? { ...c, ...computer } : c))
                    : include_new
                      ? [...prev, computer]
                      : prev,
            ),
    });

    return { computers, setComputers };
}
