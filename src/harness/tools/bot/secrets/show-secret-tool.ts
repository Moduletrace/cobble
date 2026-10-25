import { z } from "zod";
import grabComputerEnvs from "@/src/functions/backend/db/envs/grab-computer-envs";
import grabRunEnvs from "@/src/functions/backend/db/extensions/grab-run-envs";
import secretRef from "@/src/utils/secret-ref";
import type { HarnessTool } from "../../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    /**
     * The computer the run is on, whose envs count too.
     */
    computer_id?: number | string | null;
    /**
     * Called with the secret's ref, so the message always carries its chip.
     */
    onShow: (params: { ref: string }) => void;
};

type Args = {
    key: string;
};

/**
 * Lets a bot show the user an env it has (by key) as a masked chip, without
 * ever holding the value: it gets a `[secret:ID]` ref, and the chat
 * fetches the value only for whoever may see it (`canRevealEnv`).
 */
export default function showSecretTool({ user_id, bot_id, workspace_id, computer_id, onShow }: Params): HarnessTool<Args> {
    return {
        name: "show_secret",
        description: `Show the user one of your envs (by key, e.g. a password or token they saved or you captured) without reading it: you get a [secret:ID] ref to put in your message, which the user sees masked with Reveal and Copy. Never print a secret with a command to show it. Only its owner (for a personal secret) or a super admin can reveal it.`,
        schema: z.object({
            key: z.string().trim().min(1).max(128),
        }),
        run: async ({ args }) => {
            const key = args.key.trim();
            const on_computer = computer_id
                ? await grabComputerEnvs({ computer_id, bot_id, user_id, workspace_id })
                : [];
            const env =
                on_computer.find((e) => e.key == key) ||
                (await grabRunEnvs({ bot_id, user_id, workspace_id })).find((e) => e.key == key);

            if (!env) return `No env called ${key} reaches you here. Ask the user with request_secret if you need it.`;

            const ref = secretRef({ id: env.id });

            onShow({ ref });

            return `Put ${ref} in your message: the user sees ${key} masked, with Reveal and Copy. Never repeat or guess the value.`;
        },
    };
}
