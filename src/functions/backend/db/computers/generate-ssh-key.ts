import ssh2 from "ssh2";
import saveSshKey from "./save-ssh-key";

/**
 * Generates an Ed25519 SSH keypair with comment "cobble", stores the encrypted
 * private key in app_settings, and returns the OpenSSH public key string.
 */
export default async function generateSshKey(): Promise<{ public_key: string }> {
    const pair = ssh2.utils.generateKeyPairSync("ed25519", { comment: "cobble" });
    await saveSshKey({ private_key: pair.private });
    return { public_key: pair.public };
}
