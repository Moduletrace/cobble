type Params = {
    url: string;
    timeout_ms?: number;
};

/**
 * Whether something answers `url` with a status below 500.
 */
export default async function isPortAnswering({ url, timeout_ms = 2000 }: Params) {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(timeout_ms) });

        await res.body?.cancel().catch(() => {});

        return res.status < 500;
    } catch {
        return false;
    }
}
