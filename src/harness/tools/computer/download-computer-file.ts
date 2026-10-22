type Params = {
    /**
     * The sandbox's REST address (no `/mcp`).
     */
    base_url: string;
    /**
     * The file on the computer, absolute.
     */
    path: string;
    /**
     * Refuse it above this many bytes.
     */
    max_bytes: number;
    signal?: AbortSignal;
};

export type ComputerDownload =
    | { ok: true; bytes: Buffer; size: number }
    | { ok: false; reason: "missing" | "too_big" | "cut_short"; size: number };

/**
 * A computer's file, byte for byte. It goes through the sandbox's own
 * download endpoint (`/v1/file/download`), which streams the file as it
 * is, rather than its shell: a shell's output is capped (30,000
 * characters) and would silently cut a big file short, which is exactly
 * how a 1.12 MiB archive once arrived as 22 KB.
 *
 * The size is read first so nothing over the limit is transferred, and the
 * download asks the sandbox to abort if the file changes while it is sent
 * (`change_policy=abort`); the length is also checked, so a cut-short
 * transfer is reported instead of being saved.
 */
export default async function downloadComputerFile({
    base_url,
    path,
    max_bytes,
    signal,
}: Params): Promise<ComputerDownload> {
    const size = await fileSize({ base_url, path, signal });

    if (size == null) return { ok: false, reason: "missing", size: 0 };
    if (size > max_bytes) return { ok: false, reason: "too_big", size };

    const res = await fetch(
        `${base_url}/v1/file/download?path=${encodeURIComponent(path)}&change_policy=abort`,
        {
            signal: AbortSignal.any([
                ...(signal ? [signal] : []),
                AbortSignal.timeout(size > 5 * 1024 * 1024 ? 120_000 : 60_000),
            ]),
        },
    );

    if (res.status == 409) return { ok: false, reason: "cut_short", size };

    if (!res.ok) {
        throw new Error(`The computer refused to send ${path}: ${res.status}`);
    }

    const bytes = Buffer.from(await res.arrayBuffer());

    if (bytes.byteLength != size) {
        return { ok: false, reason: "cut_short", size: bytes.byteLength };
    }

    return { ok: true, bytes, size };
}

/**
 * A file's size on the computer, or null when it isn't there.
 */
async function fileSize({
    base_url,
    path,
    signal,
}: {
    base_url: string;
    path: string;
    signal?: AbortSignal;
}) {
    const { output } = await import("./run-computer-command").then((mod) =>
        mod.default({
            base_url,
            command: `f=${shellQuote({ text: path })}; if [ -f "$f" ]; then wc -c < "$f"; fi`,
            timeout_ms: 30_000,
            signal,
        }),
    );

    const digits = output.trim().match(/^\d+/)?.[0];

    return digits ? Number(digits) : null;
}

/**
 * A path as one shell word, so a name with spaces or quotes is still one
 * argument.
 */
export function shellQuote({ text }: { text: string }) {
    return `'${text.split("'").join(`'\\''`)}'`;
}

