import { execFileSync } from "node:child_process";
import { AgentState } from "./agent-state";
import { AgentConfig } from "./config";
import guardRuleset from "./guard-ruleset";
import log from "./log";

/**
 * Keeps worker accounts off the services on loopback (`guardRuleset`),
 * which needs the container's `NET_ADMIN`. Until it's in place
 * (`AgentState.workers_guarded`), worker commands are refused: run
 * without it, a worker could reach the shell as gem, and so root.
 */
export default function guardServicePorts() {
    try {
        const rules = guardRuleset({
            uid_from: AgentConfig.WorkerIdBase + 1,
            uid_to: AgentConfig.WorkerIdBase + AgentConfig.MaxRunId,
            ports: [AgentConfig.Port, AgentConfig.VncPort, AgentConfig.CdpPort, AgentConfig.McpPort, AgentConfig.TerminalPort],
        });

        execFileSync("nft", ["-f", "-"], { input: rules, stdio: ["pipe", "ignore", "pipe"], timeout: 10_000 });
        execFileSync("nft", ["list", "table", "inet", "cobble_guard"], { stdio: "ignore", timeout: 10_000 });

        AgentState.workers_guarded = true;
        AgentState.guard_error = "";
        log({ name: "agent", message: "worker accounts are kept off the computer's services" });
    } catch (error: any) {
        AgentState.workers_guarded = false;
        AgentState.guard_error = String(error?.stderr || error?.message || error).trim().slice(0, 500);
        log({ name: "agent", message: `couldn't guard the services from worker accounts, so worker commands are refused: ${AgentState.guard_error}` });
    }
}
