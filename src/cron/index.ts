import bunext from "@moduletrace/bunext";
import cronHeartbeat from "./heartbeat";
import pruneBotsQueue from "./prune-bots-queue";
import cronSyncHarnessModels from "./sync-harness-models";
import syncComputers from "./sync-computers";
import runCronJobs from "./run-cron-jobs";
import registerCronJob from "./register-cron-job";

export default function cron() {
    if (process.env.NODE_ENV == "production" && !process.env.MAIN_SERVER) {
        return;
    }

    bunext.bunextLog.watch(`Running Cron Services ...`);

    registerCronJob({
        title: "heartbeat",
        schedule: "@hourly",
        task: cronHeartbeat,
        run_on_start: true,
    });

    registerCronJob({
        title: "prune-bots-queue",
        schedule: "@daily",
        task: pruneBotsQueue,
    });

    registerCronJob({
        title: "sync-harness-models",
        schedule: "@hourly",
        task: cronSyncHarnessModels,
        run_on_start: true,
    });

    registerCronJob({
        title: "sync-computers",
        schedule: "*/5 * * * *",
        task: syncComputers,
        run_on_start: true,
    });

    registerCronJob({
        title: "run-cron-jobs",
        schedule: "* * * * *",
        task: runCronJobs,
        run_on_start: true,
        quiet: true,
    });
}
