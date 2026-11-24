/**
 * Compares the expected host key fingerprint against the hex fingerprint
 * presented by the SSH server during the handshake. If no fingerprint is
 * expected yet (trust on first use), it accepts.
 */
export default function verifyHostFingerprint({
    expected,
    hex,
}: {
    expected?: string | null;
    hex: string;
}): boolean {
    if (!expected) return true;

    const cleanExpected = expected.replace(/^SHA256:/i, "").trim().toLowerCase();
    const cleanHex = hex.replace(/^SHA256:/i, "").trim().toLowerCase();

    return cleanExpected === cleanHex;
}
