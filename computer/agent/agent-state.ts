/**
 * What the health check and `/api/info` report, kept current by the
 * services as they start and stop.
 */
export const AgentState = {
    browser_binary: "",
    browser_version: "",
    browser_sandbox: true,
    /**
     * Whether worker accounts are kept off the services on loopback
     * (`guardServicePorts`); without it their commands are refused.
     */
    workers_guarded: false,
    guard_error: "",
};
