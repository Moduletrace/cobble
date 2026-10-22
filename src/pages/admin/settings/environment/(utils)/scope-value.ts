import type { EnvScope, PublicEnv } from "@/src/types";

/**
 * A scope as one select value: `general`, `workspace:3`, `bot:1`,
 * `computer:1`.
 */
export default function scopeValue({ scope }: { scope: Pick<EnvScope, "paradigm" | "id"> }) {
    return scope.paradigm == "general" ? "general" : `${scope.paradigm}:${scope.id}`;
}

/**
 * Whether an env is set in this scope.
 */
export function envInScope({ env, scope }: { env: PublicEnv; scope: EnvScope }) {
    if (env.paradigm != scope.paradigm) return false;
    if (scope.paradigm == "workspace") return env.workspace_id == scope.id;
    if (scope.paradigm == "bot") return env.bot_id == scope.id;
    if (scope.paradigm == "computer") return env.computer_id == scope.id;
    return true;
}
