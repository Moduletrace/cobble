const key = process.env.ENCRYPTION_KEY;
const salt = process.env.ENCRYPTION_SALT;

async function getKey() {
    const material = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(key),
        "PBKDF2",
        false,
        ["deriveKey"],
    );
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: new TextEncoder().encode(salt),
            iterations: 100000,
            hash: "SHA-256",
        },
        material,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
    );
}

export async function encrypt(text: string): Promise<string> {
    const derivedKey = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        derivedKey,
        new TextEncoder().encode(text),
    );
    const combined = new Uint8Array(
        iv.length + new Uint8Array(ciphertext).length,
    );
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return btoa(String.fromCharCode(...combined));
}

export async function decrypt(encoded: string): Promise<string> {
    const derivedKey = await getKey();
    const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        derivedKey,
        ciphertext,
    );
    return new TextDecoder().decode(decrypted);
}
