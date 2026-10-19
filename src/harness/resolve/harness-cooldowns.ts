import createCooldowns from "./create-cooldowns";

/**
 * The process-wide cooldowns every harness call shares, so one job's rate
 * limit spares the next job the same failed call.
 */
const HarnessCooldowns = createCooldowns();

export default HarnessCooldowns;
