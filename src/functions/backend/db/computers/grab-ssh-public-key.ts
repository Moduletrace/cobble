import ssh2 from "ssh2";
import grabSshKey from "./grab-ssh-key";

/**
 * Derives the OpenSSH public key string from the stored encrypted private key
 * for display in settings. Returns null if no key is configured or readable.
 */
export default async function grabSshPublicKey(): Promise<string | null> {
    const stored = await grabSshKey();
    if (!stored?.private_key) return null;

    try {
        const parsed = ssh2.utils.parseKey(stored.private_key, stored.passphrase);
        if (parsed instanceof Error || !parsed || typeof (parsed as any).getPublicSSH !== "function") {
            return null;
        }

        const pubBuf = (parsed as any).getPublicSSH();
        const comment = (parsed as any).comment || "cobble";
        return `${(parsed as any).type} ${pubBuf.toString("base64")} ${comment}`.trim();
    } catch {
        return null;
    }
}
