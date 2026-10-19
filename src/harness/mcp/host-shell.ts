/**
 * The host's default shell, which runs stdio MCP servers and their setup
 * (`<shell> -c <command>`).
 */
export default function hostShell() {
    return process.env.SHELL || "/bin/bash";
}
