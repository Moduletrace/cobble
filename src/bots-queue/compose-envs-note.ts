import type { EnvParadigm } from "@/src/dict/env-dict";

type Env = { key: string; description: string; paradigm?: EnvParadigm };

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
 * Where an env comes from, as the bot is told: who else has it.
 */
const EnvSources: Record<EnvParadigm, string> = {
    general: "install-wide, every bot has it",
    workspace: "this workspace's, every bot in it has it",
    computer: "this computer's, every bot on it has it",
    bot: "yours, for every user",
    user: "this user's own, for you",
};

/**
 * Added to a chat reply so the bot knows which envs it already has (keys,
 * descriptions and where each comes from, never values). Without it a
 * reply can't tell, asks the user for keys that are set
 * (`request_secret`), "checks" them with `show_secret` or a shell where
 * they aren't loaded, or tells the user a workspace's keys must be set
 * again for every bot.
 */
export default function composeEnvsNote({ on_computer, tools_only, has_computer }: Params) {
    const list = (envs: Env[]) =>
        envs
            .map(
                (env) =>
                    `- ${env.key}${env.paradigm ? ` (${EnvSources[env.paradigm]})` : ""}${env.description ? `: ${env.description}` : ""}`,
            )
            .join("\n");

    if (!on_computer.length && !tools_only.length) {
        return `# Your envs\n\nNo envs are set for you here. If you need a secret, ask for it with request_secret.`;
    }

    return [
        `# Your envs\n\nThese are already set for you here (keys and descriptions; you never see values). Don't ask the user for them, and don't call show_secret or run printenv to check them: this list is the check. A workspace, computer or install-wide env reaches every bot there the same way, so it never needs setting again per bot.`,
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
