import grabAppSetting from "@/src/functions/backend/db/app-settings/grab-app-setting";
import { decrypt } from "@/src/utils/crypt";

export type StoredSshKey = {
    private_key: string;
    passphrase?: string;
};

/**
 * Reads and decrypts the install-wide SSH private key and passphrase from
 * `app_settings`. Returns null if no key is stored or decryption fails.
 */
export default async function grabSshKey(): Promise<StoredSshKey | null> {
    const encryptedKey = await grabAppSetting({ key: "ssh_private_key" });
    if (!encryptedKey) return null;

    try {
        const private_key = await decrypt(encryptedKey);
        const encryptedPassphrase = await grabAppSetting({ key: "ssh_private_key_passphrase" });
        const passphrase = encryptedPassphrase ? await decrypt(encryptedPassphrase) : undefined;

        return { private_key, passphrase };
    } catch {
        return null;
    }
}
