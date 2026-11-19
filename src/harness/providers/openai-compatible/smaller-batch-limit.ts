import HarnessError from "../../harness-error";

type Params = {
    error: unknown;
    /**
     * How many texts the refused request carried.
     */
    size: number;
};

/**
 * The batch size to try when a provider refused a batch for being too large.
 *
 * Alibaba's Model Studio compatible API answers "Value error, batch size is
 * invalid, it should not be larger than 20.: input.contents" and refuses the
 * whole request, so nothing is embedded until the batch fits. Returns the
 * limit the provider stated, else half the refused batch; null when the
 * refusal is something else, or when one text alone was still refused (that
 * is a real failure, not a size one).
 */
export default function smallerBatchLimit({ error, size }: Params): number | null {
    if (!(error instanceof HarnessError) || error.status !== 400) return null;

    if (!/batch size/i.test(error.message) && !/too many inputs/i.test(error.message)) return null;

    const stated = /(?:larger than|at most|maximum of|limit of)\s*(\d+)/i.exec(error.message);
    const stated_limit = stated ? Number(stated[1]) : 0;
    const next = stated_limit > 0 && stated_limit < size ? stated_limit : Math.floor(size / 2);

    return next >= 1 && next < size ? next : null;
}