/**
 * A worker bot's own account on a computer, as the computer's agent makes
 * it (`computer/agent/run-user-for.ts`; keep both alike): `cb-<bot id>`,
 * without sudo, its home inside the container (the env files live there).
 */
export default function computerWorkerAccount({ bot_id }: { bot_id: number | string }) {
    const name = `cb-${Number(bot_id)}`;

    return { name, home: `/home/${name}` };
}
