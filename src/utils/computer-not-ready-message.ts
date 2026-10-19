import { ContainerStatuses, type ContainerStatus } from "@/src/dict/computer-dict";

type Params = {
    name?: string | null;
    status: ContainerStatus;
};

/**
 * Why a computer can't be reached yet, e.g. "Main computer isn't ready
 * yet: it's starting."
 */
export default function computerNotReadyMessage({ name, status }: Params) {
    const title = ContainerStatuses.find((s) => s.value == status)?.title || "Unknown";

    return `${name || "The computer"} isn't ready yet: it's ${title.toLowerCase()}.`;
}
