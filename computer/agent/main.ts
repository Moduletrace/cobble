import { AgentConfig } from "./config";
import createAgentServer from "./create-agent-server";
import log from "./log";
import prepareRunDirs from "./prepare-run-dirs";
import startServices from "./start-services";
import type { Supervised } from "./supervise-process";

/**
 * The computer's agent, its container's main process (under tini): starts
 * the browser and what it needs, and serves the app on one port. On TERM
 * (docker stop) it stops them in order, so Chrome saves its profile.
 */
async function main() {
    prepareRunDirs();

    let services: Supervised[] = [];
    let stopping = false;

    const stop = async () => {
        if (stopping) return;

        stopping = true;
        log({ name: "agent", message: "stopping" });

        for (const service of services) await service.stop({ grace_ms: AgentConfig.StopGraceMs });

        process.exit(0);
    };

    process.on("SIGTERM", stop);
    process.on("SIGINT", stop);

    createAgentServer().listen(AgentConfig.Port, "0.0.0.0", () => {
        log({ name: "agent", message: `listening on ${AgentConfig.Port}${AgentConfig.Token ? "" : " (no token set: open to anyone who reaches it)"}` });
    });

    services = await startServices();
}

main().catch((error) => {
    log({ name: "agent", message: `couldn't start: ${error?.stack || error}` });
    process.exit(1);
});
