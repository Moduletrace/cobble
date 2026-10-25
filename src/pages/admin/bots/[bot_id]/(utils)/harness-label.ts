import { Harnesses } from "@/src/dict/harness-dict";

/**
 * What a harness is called in a message's details: its title in Settings,
 * under Models.
 */
export default function harnessLabel({ harness }: { harness: string }) {
    return Harnesses.find((h) => h.value == harness)?.title || harness;
}
