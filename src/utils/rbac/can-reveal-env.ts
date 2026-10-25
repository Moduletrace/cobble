import type { CrewRole } from "./crew-role";

type Params = {
    env: { paradigm: string; user_id: number | null };
    viewer_id: number | string;
    role: CrewRole;
    /**
     * Whether the viewer still reaches the env's bot (for a personal one).
     */
    reaches_bot: boolean;
};

/**
 * Who may see a secret's value in the chat (`[secret:ID]`): a personal
 * one only its own user, while they still reach its bot; any other env
 * only a super admin, as on the Environment page. A bot never may: the
 * value only ever goes to the viewer's browser.
 */
export default function canRevealEnv({ env, viewer_id, role, reaches_bot }: Params) {
    if (env.paradigm == "user") return env.user_id == Number(viewer_id) && reaches_bot;

    return role == "super_admin";
}
