/**
 * A base64url VAPID public key as the bytes `PushManager.subscribe`
 * expects.
 */
export default function urlBase64ToUint8Array(base64_string: string) {
    const padding = "=".repeat((4 - (base64_string.length % 4)) % 4);
    const base64 = (base64_string + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const raw = atob(base64);
    const bytes = new Uint8Array(raw.length);

    for (let index = 0; index < raw.length; index += 1) {
        bytes[index] = raw.charCodeAt(index);
    }

    return bytes;
}
