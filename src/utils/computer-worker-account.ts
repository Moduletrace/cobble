/**
 * A worker bot's own account on a computer, as the computer's agent makes
 * it (`computer/agent/run-user-for.ts`; keep both alike): `cb-<bot id>`,
 * without sudo. Its home stays inside the container (the env files live
 * there); only `workspace` in it is kept, a link the agent makes to the
 * bot's folder on the computer's mounted workspace (`bots/<bot id>`).
 */
export default function computerWorkerAccount({ bot_id }: { bot_id: number | string }) {
    const name = `cb-${Number(bot_id)}`;
    const home = `/home/${name}`;

    return { name, home, workspace: `${home}/workspace` };
}
