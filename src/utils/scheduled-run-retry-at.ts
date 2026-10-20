import { AppData } from "@/src/data/app-data";

type Params = {
    /**
     * Attempts the job has used so far, the failed one included.
     */
    attempts: number;
    now?: number;
};

/**
 * When a failed scheduled run is tried again: `AppData.ScheduledRunRetryMs`
 * after the first failure, doubling after each one after that.
 */
export default function scheduledRunRetryAt({ attempts, now = Date.now() }: Params) {
    const step = Math.min(Math.max(attempts - 1, 0), 10);

    return now + AppData.ScheduledRunRetryMs * 2 ** step;
}
