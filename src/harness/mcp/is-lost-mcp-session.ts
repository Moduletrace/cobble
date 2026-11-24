/**
 * Whether an MCP error means the session this run opened is gone. The
 * computer's agent restarts Playwright MCP on its own whenever it exits
 * (`computer/agent/start-services.ts`), and a restart invalidates every
 * session id the server handed out: the next call fails with `Session not
 * found` for the rest of the run, which is how a routine's browser died
 * mid-pass (Nov 2026). Calling again after a reconnect is safe: a session id
 * the server no longer knows cannot run the call a second time.
 *
 * Broad on purpose: a false match costs one reconnect that fails the same
 * way, a miss costs the run.
 */
const LostSession =
    /session not found|not connected|connection (?:closed|refused)|fetch failed|socket hang up|transport closed|ECONNRESET|ECONNREFUSED/i;

export default function isLostMcpSession({ text }: { text: string }) {
    return LostSession.test(text);
}
