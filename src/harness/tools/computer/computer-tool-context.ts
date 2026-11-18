import type { ComputerApi } from "@/src/functions/backend/computers/computer-fetch";
import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";

/**
 * What a run's own computer tools share: the computer, the run's folders
 * on it (every path is kept inside them), the env file its commands load,
 * the redaction its secret values go through, and where the run is, so a
 * delete inside a folder mounted from the host can wait for its user
 * (`host-directory-delete-guard`).
 */
export type ComputerToolContext = {
    computer: ComputerApi;
    computer_id: number;
    dirs: ComputerRunDirs;
    shell_path: string;
    redact: (text: string) => string;
    bot_id: number;
    workspace_id: number | null;
    session_id: number;
};