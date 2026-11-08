import type { ContainerStatus } from "@/src/dict/computer-dict";

type Params = {
    status: ContainerStatus;
};

/**
 * States a computer doesn't come back from by itself: someone has to
 * Restart or Retry it. A run queued on one would only fail, so
 * `start_task` refuses it and a task run on one fails without retrying.
 * Being set up (`created` included), starting, restarting or unhealthy can
 * pass, as can a state not inspected yet (`unknown`).
 */
export default function isComputerDown({ status }: Params) {
    return ComputerDownStatuses.includes(status);
}

const ComputerDownStatuses: ContainerStatus[] = ["failed", "dead", "exited", "removing", "paused"];
