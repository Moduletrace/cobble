type Params = {
    /**
     * The sandbox's REST address (no `/mcp`).
     */
    base_url: string;
    command: string;
    timeout_ms: number;
    signal?: AbortSignal;
};

/**
 * Runs one shell command on a computer over the sandbox's REST API
 * (`/v1/shell/exec`), outside any MCP session. Throws when the computer
 * can't be reached or refuses the command.
 */
export default async function runComputerCommand({
    base_url,
    command,
    timeout_ms,
    signal,
}: Params): Promise<{ output: string; exit_code: number | null }> {
    const res = await fetch(`${base_url}/v1/shell/exec`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ command }),
        signal: AbortSignal.any([
            ...(signal ? [signal] : []),
            AbortSignal.timeout(timeout_ms),
        ]),
    });
    const body: any = await res.json().catch(() => ({}));

    if (!res.ok || body?.success === false) {
        throw new Error(`The computer refused the command: ${body?.message || res.status}`);
    }

    return {
        output: String(body?.data?.output ?? ""),
        exit_code: typeof body?.data?.exit_code == "number" ? body.data.exit_code : null,
    };
}
