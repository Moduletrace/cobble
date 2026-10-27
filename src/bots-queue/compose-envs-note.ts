type Env = { key: string; description: string };

type Params = {
    /**
     * Set on the bot's current computer for its tasks (`grabReachableEnvs`).
     */
    on_computer: Env[];
    /**
     * Only filled into tools' templates.
     */
    tools_only: Env[];
    /**
     * Whether the bot has a computer, so tasks can use the computer's envs.
     */
    has_computer: boolean;
};

/**
 * Added to a chat reply so the bot knows which envs it already has (keys
 * and descriptions, never values). Without it a reply can't tell, asks the
 * user for keys that are set (`request_secret`), or "checks" them with
 * `show_secret` or a shell where they aren't loaded.
 */
export default function composeEnvsNote({ on_computer, tools_only, has_computer }: Params) {
    const list = (envs: Env[]) =>
        envs.map((env) => `- ${env.key}${env.description ? `: ${env.description}` : ""}`).join("\n");

    if (!on_computer.length && !tools_only.length) {
        return `# Your envs\n\nNo envs are set for you here. If you need a secret, ask for it with request_secret.`;
    }

    return [
        `# Your envs\n\nThese are already set for you here (keys and descriptions; you never see values). Don't ask the user for them, and don't call show_secret or run printenv to check them: this list is the check.`,
        on_computer.length
            ? `On your computer, as $KEY in a task's shell and code (start_task; search_computers doesn't load them):\n${list(on_computer)}`
            : "",
        tools_only.length
            ? `${has_computer ? "Only in tools" : "In tools"}, as {{env.KEY}}${has_computer ? " (not set on computers)" : ""}:\n${list(tools_only)}`
            : "",
    ]
        .filter(Boolean)
        .join("\n\n");
}
