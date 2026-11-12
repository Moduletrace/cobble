type Params = {
    /**
     * How many readings to keep (`AppData.HarnessMediaReadingsCached`).
     */
    max?: number;
};

/**
 * Readings of images by what they are (`imageReadingKey`), kept across
 * runs: the same image was read again on every reply, one vision call
 * each time, since a run's own cache (`media_cache`) dies with it.
 *
 * Oldest first out when it's full, and a reading that's used again moves
 * to the back, so a picture the conversation keeps coming back to stays.
 */
export default function createReadingCache({ max = 100 }: Params = {}) {
    const readings = new Map<string, string>();

    return {
        get({ key }: { key: string }) {
            const text = readings.get(key);

            if (text === undefined) return undefined;

            readings.delete(key);
            readings.set(key, text);

            return text;
        },
        set({ key, text }: { key: string; text: string }) {
            readings.delete(key);
            readings.set(key, text);

            while (readings.size > max) {
                const oldest = readings.keys().next().value;

                if (oldest === undefined) break;

                readings.delete(oldest);
            }
        },
        clear() {
            readings.clear();
        },
        size: () => readings.size,
    };
}

export type ReadingCache = ReturnType<typeof createReadingCache>;
