type Params = {
    check: () => Promise<boolean>;
    every_ms: number;
};

/**
 * Resolves once `check` passes, trying every `every_ms`.
 */
export default async function waitUntil({ check, every_ms }: Params) {
    while (!(await check())) {
        await new Promise((resolve) => setTimeout(resolve, every_ms));
    }
}
