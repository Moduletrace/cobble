import ssh2 from "ssh2";
import saveAppSetting from "@/src/functions/backend/db/app-settings/save-app-setting";
import AppError from "@/src/utils/app-error";
import { encrypt } from "@/src/utils/crypt";

type Params = {
    private_key: string;
    passphrase?: string;
};

/**
 * Validates the SSH private key (and optional passphrase), encrypts them,
 * and persists them into `app_settings`. Throws `AppError` if the key is
 * invalid or unreadable.
 */
export default async function saveSshKey({ private_key, passphrase }: Params): Promise<void> {
    const trimmed = private_key.trim();
    if (!trimmed) {
        throw new AppError("Please provide an SSH private key.");
    }

    // Validate that ssh2 can parse the key with the passphrase
    const parsed = ssh2.utils.parseKey(trimmed, passphrase);
    if (parsed instanceof Error || !parsed) {
        const msg = parsed instanceof Error ? parsed.message : "Invalid key";
        throw new AppError(`Cannot parse SSH key: ${msg}`);
    }

    const encryptedKey = await encrypt(trimmed);
    await saveAppSetting({ key: "ssh_private_key", value: encryptedKey });

    if (passphrase) {
        const encryptedPassphrase = await encrypt(passphrase);
        await saveAppSetting({ key: "ssh_private_key_passphrase", value: encryptedPassphrase });
    } else {
        await saveAppSetting({ key: "ssh_private_key_passphrase", value: null });
    }
}
