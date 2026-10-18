import grabUserPasswordHash from "./grab-user-password-hash";
import hashPassword from "./hash-password";

type Params = {
    user_id?: string | number;
    password: string;
};

let dummy_hash: Promise<string> | undefined;

/**
 * Checks a password against the user's stored hash. Unknown users and
 * users without a password still pay for a full hash comparison, so
 * response timing doesn't reveal which accounts exist.
 */
export default async function verifyUserPassword({
    user_id,
    password,
}: Params) {
    const password_hash = user_id
        ? await grabUserPasswordHash({ user_id })
        : undefined;

    if (!password_hash) {
        dummy_hash ||= hashPassword({ password: crypto.randomUUID() });
        await Bun.password.verify(password, await dummy_hash);
        return false;
    }

    return await Bun.password.verify(password, password_hash);
}
