import { getDefaultEnvironment } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { McpServerRecord } from "@/src/types";
import fillTemplate from "@/src/utils/fill-template";

type Params = {
    server: McpServerRecord;
    envs: { key: string; value: string }[];
};

/**
 * The only environment a stdio MCP server (and its setup) gets: the
 * basics a shell needs (`PATH`, `HOME`, `SHELL`, `USER`, ...) plus its own
 * `env`, filled from the envs. Never the app's own environment, which
 * holds its encryption key.
 */
export default function grabMcpStdioEnv({ server, envs }: Params): Record<string, string> {
    return {
        ...getDefaultEnvironment(),
        ...Object.fromEntries(
            Object.entries(server.env).map(([key, value]) => [key, fillTemplate({ template: value, envs })]),
        ),
    };
}
