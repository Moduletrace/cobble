import { accessSync, constants, statSync } from "fs";

type Params = {
    /**
     * `TLS_CERT_FILE`, the certificate (or chain) the app serves.
     */
    cert_file?: string;
    /**
     * `TLS_KEY_FILE`, its private key.
     */
    key_file?: string;
};

export type TlsOptions = {
    cert: ReturnType<typeof Bun.file>;
    key: ReturnType<typeof Bun.file>;
};

/**
 * `Bun.serve`'s TLS options from the certificate paths the installer sets,
 * or `undefined` when the app runs over plain HTTP.
 *
 * A half-configured or unreadable certificate is an error, never a silent
 * fall back to HTTP: downgrading the connection quietly would drop the
 * `Secure` cookies and the secure context the installed app and Web Push
 * need.
 */
export default function resolveTlsOptions({
    cert_file,
    key_file,
}: Params): TlsOptions | undefined {
    const cert = cert_file?.trim();
    const key = key_file?.trim();

    if (!cert && !key) return undefined;

    if (!cert || !key) {
        throw new Error(
            "TLS_CERT_FILE and TLS_KEY_FILE must both be set, or neither.",
        );
    }

    for (const file of [cert, key]) {
        try {
            if (!statSync(file).isFile()) throw new Error("not a file");

            accessSync(file, constants.R_OK);
        } catch {
            throw new Error(
                `Can't read the TLS file ${file}. Check that it is mounted and readable.`,
            );
        }
    }

    return { cert: Bun.file(cert), key: Bun.file(key) };
}
