import { z } from "zod";
import grabReachableEnvs from "@/src/functions/backend/db/envs/grab-reachable-envs";
import createSecretRequest from "@/src/functions/backend/db/secret-requests/create-secret-request";
import secretRequestRef from "@/src/utils/secret-request-ref";
import type { HarnessTool } from "../../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The conversation it's asked in, where its card shows.
     */
    session_id: number | string;
    workspace_id?: number | string | null;
    /**
     * The computer the run is on, whose envs count as already set.
     */
    computer_id?: number | string | null;
    /**
     * Whether the run is a task, which stops and reports rather than waits.
     */
    in_task?: boolean;
    /**
     * Called with the request's ref, so the message always carries its card.
     */
    onRequest: (params: { ref: string }) => void;
};

type Args = {
    key: string;
    description: string;
    reason: string;
    replace?: boolean;
};

/**
 * Lets a bot ask the user for a secret (a password, token or API key)
 * without it going through the chat: the user types it into a card, it's
 * saved as their personal secret for this bot, and the bot only ever
 * learns that it's saved and its key.
 */
export default function requestSecretTool({
    user_id,
    bot_id,
    session_id,
    workspace_id,
    computer_id,
    in_task,
    onRequest,
}: Params): HarnessTool<Args> {
    return {
        name: "request_secret",
        description: `Ask the user for a secret you need (a password, token or API key) through a masked card in the chat, never by asking them to type it into a message: what they type there goes to you and the model provider, the card's value never does. It's saved as their own secret for you, under key, and set as $KEY in your shell (and {{env.KEY}} for tools) on this user's later runs; you never see the value. A key listed in "Your envs" is already set (the workspace, the computer or the user may have saved it): don't ask for it, use it. Their answer comes as a message saying it's saved${
            in_task ? `. In a task, ask, then stop and report that you're waiting for it.` : `.`
        }`,
        schema: z.object({
            key: z.string().trim().min(1).max(128).describe("The env key to save it under, e.g. GITHUB_TOKEN"),
            description: z.string().trim().min(1).max(500).describe("What it is, shown on the card, e.g. \"GitHub personal access token with repo scope\""),
            reason: z.string().trim().min(10, "Say why you need it").max(2000).describe("Why you need it and what you'll do with it, shown on the card as your words"),
            replace: z
                .boolean()
                .optional()
                .describe("Only when the user asked to replace a key you already have: their answer is saved as their own and wins over the existing one."),
        }),
        run: async ({ args }) => {
            const key = args.key.trim();

            if (!args.replace) {
                const { on_computer, tools_only } = await grabReachableEnvs({ bot_id, user_id, workspace_id, computer_id });
                const existing = [...on_computer, ...tools_only].find((env) => env.key == key);

                if (existing) {
                    throw new Error(
                        `${key} is already set for you here (${existing.paradigm == "user" ? "the user's own secret" : `a ${existing.paradigm} env`}), so no card was sent. Use it as $${key} in a task on your computer or {{env.${key}}} in tools. Ask again with replace only if the user wants a new value.`,
                    );
                }
            }

            const id = await createSecretRequest({
                user_id,
                bot_id,
                session_id,
                workspace_id,
                key,
                description: args.description,
                reason: args.reason,
            });

            onRequest({ ref: secretRequestRef({ id }) });

            return `Asked the user for ${key}: the card is on your message. Their answer arrives as a message once it's saved; then it's $${key} on your computers. Never ask them to paste it in the chat.`;
        },
    };
}
