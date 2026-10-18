export default function generateCSRF() {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);

    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}