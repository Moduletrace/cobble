import bunext from "@moduletrace/bunext";
import cronHeartbeat from "./heartbeat";
import pruneBotsQueue from "./prune-bots-queue";
import cronClearJobSteps from "./clear-job-steps";
import pruneBotHookEvents from "./prune-bot-hook-events";
import cronPruneChatrooms from "./prune-chatrooms";
import cronPruneComputerCaches from "./prune-computer-caches";
import cronPruneComputerHomes from "./prune-computer-homes";
import cronPruneOrphanMedia from "./prune-orphan-media";
import pruneLogs from "./prune-logs";
import syncNotifyWatchers from "./sync-notify-watchers";
import cronSyncHarnessModels from "./sync-harness-models";
import syncComputers from "./sync-computers";
import cronSyncAppNetworks from "./sync-app-networks";
import syncMcpServers from "./sync-mcp-servers";
import runCronJobs from "./run-cron-jobs";
import ingestPendingFiles from "./ingest-pending-files";
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
        title: "clear-job-steps",
        schedule: "*/5 * * * *",
        task: cronClearJobSteps,
        quiet: true,
    });

    registerCronJob({
        title: "prune-bot-hook-events",
        schedule: "@daily",
        task: pruneBotHookEvents,
    });

    registerCronJob({
        title: "prune-chatrooms",
        schedule: "@daily",
        task: cronPruneChatrooms,
    });

    registerCronJob({
        title: "prune-orphan-media",
        schedule: "@daily",
        task: cronPruneOrphanMedia,
    });

    registerCronJob({
        title: "prune-computer-caches",
        schedule: "@daily",
        task: cronPruneComputerCaches,
    });

    registerCronJob({
        title: "prune-computer-homes",
        schedule: "@daily",
        task: cronPruneComputerHomes,
    });

    registerCronJob({
        title: "prune-logs",
        schedule: "@daily",
        task: pruneLogs,
    });

    registerCronJob({
        title: "sync-notify-watchers",
        schedule: "*/5 * * * *",
        task: syncNotifyWatchers,
        quiet: true,
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
        title: "sync-app-networks",
        schedule: "*/5 * * * *",
        task: cronSyncAppNetworks,
        quiet: true,
    });

    registerCronJob({
        title: "sync-mcp-servers",
        schedule: "@hourly",
        task: syncMcpServers,
    });

    registerCronJob({
        title: "run-cron-jobs",
        schedule: "* * * * *",
        task: runCronJobs,
        run_on_start: true,
        quiet: true,
    });

    registerCronJob({
        title: "ingest-pending-files",
        schedule: "*/10 * * * *",
        task: ingestPendingFiles,
        quiet: true,
    });
}
