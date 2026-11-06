import { AgentConfig } from "./config";
import createAgentServer from "./create-agent-server";
import createBrowserParking from "./create-browser-parking";
import guardServicePorts from "./guard-service-ports";
import log from "./log";
import prepareRunDirs from "./prepare-run-dirs";
import startServices from "./start-services";
import type { Supervised } from "./supervise-process";
import writeXAuthority from "./write-x-authority";

/**
 * The computer's agent, its container's main process (under tini): starts
 * the browser and what it needs, and serves the app on one port. Worker
 * bots' accounts are kept off its services (`guardServicePorts`) and the
 * screen asks for gem's cookie (`writeXAuthority`). On TERM
 * (docker stop) it stops them in order, so Chrome saves its profile.
 */
async function main() {
    prepareRunDirs();
    writeXAuthority();
    guardServicePorts();

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

    const parking = createBrowserParking({ cdp_port: AgentConfig.CdpPort, park_after_ms: AgentConfig.BrowserParkAfterMs });

    createAgentServer({ parking }).listen(AgentConfig.Port, "0.0.0.0", () => {
        log({ name: "agent", message: `listening on ${AgentConfig.Port}${AgentConfig.Token ? "" : " (no token set: open to anyone who reaches it)"}` });
    });

    services = await startServices({ parking });
}

main().catch((error) => {
    log({ name: "agent", message: `couldn't start: ${error?.stack || error}` });
    process.exit(1);
});
