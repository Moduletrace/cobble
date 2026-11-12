import { AppData } from "@/src/data/app-data";
import createReadingCache from "./create-reading-cache";

/**
 * The process-wide image readings every run shares, so one upload is read
 * once rather than once per reply.
 */
const MediaReadings = createReadingCache({
    max: AppData.HarnessMediaReadingsCached,
});

export default MediaReadings;
