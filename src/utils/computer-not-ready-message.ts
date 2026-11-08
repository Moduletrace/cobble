import { ContainerStatuses, type ContainerStatus } from "@/src/dict/computer-dict";
import isComputerDown from "./computer-down";

type Params = {
    name?: string | null;
    status: ContainerStatus;
};

/**
 * Why a computer can't be reached, e.g. "Main computer isn't ready yet:
 * it's starting." A computer that won't come back by itself
 * (`isComputerDown`) says so and who can bring it back.
 */
export default function computerNotReadyMessage({ name, status }: Params) {
    const title = ContainerStatuses.find((s) => s.value == status)?.title || "Unknown";

    if (isComputerDown({ status })) {
        return `${name || "The computer"} is down (${title.toLowerCase()}). A super admin can Restart or Retry it in Settings > Computers.`;
    }

    return `${name || "The computer"} isn't ready yet: it's ${title.toLowerCase()}.`;
}
