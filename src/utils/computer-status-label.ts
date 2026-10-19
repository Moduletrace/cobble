import { ContainerStatuses } from "@/src/dict/computer-dict";
import type { ComputerWithStatus } from "@/src/types";

type Params = {
    computer: ComputerWithStatus;
};

/**
 * A computer's state in a few words.
 */
export default function computerStatusLabel({ computer }: Params) {
    if (computer.status == "creating") return "Setting up…";
    if (computer.status == "failed") return computer.error ? `Setup failed: ${computer.error}` : "Setup failed";

    return ContainerStatuses.find((s) => s.value == computer.status)?.title || "Unknown";
}
