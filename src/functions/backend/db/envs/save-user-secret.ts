import AppError from "@/src/utils/app-error";
import grabUserBot from "../bots/grab-user-bot";
import grabBotWorkspaceIds from "../workspaces/grab-bot-workspace-ids";
import grabAllEnvs from "./grab-all-envs";
import saveEnv from "./save-env";

type Params = {
    /**
     * Whose secret it is: only their runs of the bot get it, and only they
     * may reveal it.
     */
    user_id: number | string;
    bot_id: number | string;
    key: string;
    value: string;
    description?: string;
};

/**
 * Saves a user's personal secret for one bot (an env with paradigm
 * `user`): what they typed into a secret request's card, or what a bot
 * captured on a computer for them. Always secret and put on computers, so
 * it reaches that user's runs by key and is redacted from everything the
 * bot reads. Replaces the value when they already have that key for the
 * bot. The user must still reach the bot. Returns the env's id.
 */
export default async function saveUserSecret({ user_id, bot_id, key, value, description }: Params) {
    const bot = await grabUserBot({ bot_id, user_id });

    if (!bot?.id) throw new AppError(`You no longer have this bot.`);

    if (!value) throw new AppError(`Enter a value.`);

    const all = await grabAllEnvs();
    const trimmed = key.trim();

    const existing = all.find(
        (env) =>
            env.paradigm == "user" &&
            env.bot_id == Number(bot_id) &&
            env.user_id == Number(user_id) &&
            env.key == trimmed,
    );

    // A personal secret overrides every wider scope for this user's runs
    // (general < workspace < bot < user). Letting a member set a key a wider
    // scope already holds would let them repoint where that scope's secrets
    // are sent (an MCP URL or header reading `{{env.API_HOST}}`), so a key
    // already set at a wider scope that reaches this bot is refused (H6).
    const workspace_ids = bot.kind == "coordinator" ? null : await grabBotWorkspaceIds({ bot_id });
    const collision = all.find(
        (env) =>
            env.key == trimmed &&
            (env.paradigm == "general" ||
                (env.paradigm == "bot" && env.bot_id == Number(bot_id)) ||
                (env.paradigm == "workspace" &&
                    (workspace_ids === null || workspace_ids.includes(Number(env.workspace_id))))),
    );

    if (collision) {
        throw new AppError(
            `"${trimmed}" is already set for this bot at a wider scope, so a personal secret can't replace it. Ask a super admin to change it in Settings > Environment.`,
        );
    }

    return await saveEnv({
        user_id: Number(user_id),
        env_id: existing?.id,
        key,
        value,
        description: description ?? existing?.description,
        paradigm: "user",
        bot_id: Number(bot_id),
        owner_user_id: Number(user_id),
        secret: true,
        expose_to_computers: true,
    });
}
