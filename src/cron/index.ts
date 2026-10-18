import bunext from "@moduletrace/bunext";
import cronHeartbeat from "./heartbeat";
import pruneBotsQueue from "./prune-bots-queue";
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
}
