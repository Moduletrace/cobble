type Params = {
    /**
     * `TLS_CERT_FILE`, when the environment names one.
     */
    cert_file?: string;
    /**
     * `TLS_KEY_FILE`, when the environment names one.
     */
    key_file?: string;
    /**
     * `TLS_CA_FILE`, served for devices to trust.
     */
    ca_file?: string;
    /**
     * `TLS_DISABLED`, the explicit opt-out.
     */
    disabled?: string;
    /**
     * Where a certificate is looked for when the environment names none:
     * `certs/` at the project root, which is also where the container's
     * `/app/certs` mount lands.
     */
    fallback_cert_file: string;
    fallback_key_file: string;
    fallback_ca_file: string;
    file_exists: (path: string) => boolean;
};

export type TlsFiles = {
    cert_file?: string;
    key_file?: string;
    ca_file?: string;
    /**
     * Where the choice came from, for the startup log: the environment,
     * the `certs/` fallback, an explicit disable, or nothing at all.
     */
    source: "explicit" | "fallback" | "disabled" | "none";
};

const DisabledValues = new Set(["1", "true", "yes", "on"]);

/**
 * Which certificate files to serve with, in every environment: the
 * `TLS_*` variables when they are set, else `certs/` when it exists, and
 * plain HTTP only when `TLS_DISABLED` says so or there is nothing to serve
 * with.
 *
 * Nothing here is tied to `NODE_ENV`: a production process that has a
 * certificate serves HTTPS, and the only way to turn it off is to say so.
 */
export default function pickTlsFiles({
    cert_file,
    key_file,
    ca_file,
    disabled,
    fallback_cert_file,
    fallback_key_file,
    fallback_ca_file,
    file_exists,
}: Params): TlsFiles {
    if (disabled && DisabledValues.has(disabled.trim().toLowerCase())) {
        return { source: "disabled" };
    }

    const cert = cert_file?.trim();
    const key = key_file?.trim();

    if (cert || key) {
        return { cert_file: cert, key_file: key, ca_file: ca_file?.trim(), source: "explicit" };
    }

    if (file_exists(fallback_cert_file) && file_exists(fallback_key_file)) {
        return {
            cert_file: fallback_cert_file,
            key_file: fallback_key_file,
            ca_file: ca_file?.trim() ||
                (file_exists(fallback_ca_file) ? fallback_ca_file : undefined),
            source: "fallback",
        };
    }

    return { source: "none" };
}
