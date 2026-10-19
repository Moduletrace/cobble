import { useState } from "react";
import useServerEvent from "@/src/hooks/use-server-event";
import type { ComputerWithStatus } from "@/src/types";

type Params = {
    computers: ComputerWithStatus[];
};

/**
 * A list of computers kept current from `server:computer-updated` (setup
 * finishing or failing, a container stopping).
 */
export default function useLiveComputers({ computers: initial }: Params) {
    const [computers, setComputers] = useState(initial);

    useServerEvent({
        event: "server:computer-updated",
        onData: (computer: ComputerWithStatus) =>
            setComputers((prev) => prev.map((c) => (c.id == computer.id ? { ...c, ...computer } : c))),
    });

    return { computers, setComputers };
}
