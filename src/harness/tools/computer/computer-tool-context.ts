import type { ComputerApi } from "@/src/functions/backend/computers/computer-fetch";
import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";

/**
 * What a run's own computer tools share: the computer, the run's folders
 * on it (every path is kept inside them), the env file its commands load,
 * and the redaction its secret values go through.
 */
export type ComputerToolContext = {
    computer: ComputerApi;
    dirs: ComputerRunDirs;
    shell_path: string;
    redact: (text: string) => string;
};
