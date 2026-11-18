import globalCache from "@/src/utils/global-cache";
import createCooldowns from "./create-cooldowns";
import type { HarnessCooldowns } from "./create-cooldowns";

/**
 * The process-wide cooldowns every harness call shares, so one job's rate
 * limit spares the next job the same failed call.
 *
 * Held on `globalThis`, not in a module variable: bunext bundles API routes
 * and the server entry separately, so a module-scoped map let a run-limits
 * save (`HarnessCooldowns.clear()`) empty the API bundle's copy while the
 * queue kept its own benches, and a rest with no end survived the save that
 * was supposed to end it.
 */
const slot = globalCache<HarnessCooldowns>({ name: "cobble.harnessCooldowns" });

const HarnessCooldowns = slot.get() || createCooldowns();

slot.set(HarnessCooldowns);

export default HarnessCooldowns;