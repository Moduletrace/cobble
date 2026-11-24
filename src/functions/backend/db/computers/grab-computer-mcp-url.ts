import grabComputerTarget, {
    type ComputerAddress,
    type SshTarget,
} from "./grab-computer-target";

export type { ComputerAddress, SshTarget };

/**
 * Backwards-compatibility wrapper for grabComputerTarget.
 */
export default grabComputerTarget;
