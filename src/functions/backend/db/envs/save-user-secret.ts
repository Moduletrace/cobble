import AppError from "@/src/utils/app-error";
import grabUserBot from "../bots/grab-user-bot";
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

    const existing = (await grabAllEnvs()).find(
        (env) =>
            env.paradigm == "user" &&
            env.bot_id == Number(bot_id) &&
            env.user_id == Number(user_id) &&
            env.key == key.trim(),
    );

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
