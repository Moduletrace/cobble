import path from "node:path";
import { AppData } from "@/src/data/app-data";
import parseJobJson from "@/src/bots-queue/parse-job-json";

type Params = {
    computer_id: number | string;
    /**
     * The computer's kind: only the install's main computer can be
     * reached at `MAIN_COMPUTER_URL`, so only it uses
     * `MAIN_COMPUTER_DATA_DIR`.
     */
    kind?: string | null;
    /**
     * Its container's `metadata`, as `provisionComputer` wrote it (the
     * `data_dir` it bound into the container).
     */
    metadata?: string | null;
    /**
     * What `MAIN_COMPUTER_DATA_DIR` is set to, already read
     * (`grabEnv`).
     */
    main_data_dir?: string | null;
    /**
     * The data volume's root as this app sees it (`DATA_DIR`).
     */
    data_dir: string;
};

/**
 * Where a computer's home (`AppData.ComputerHomeDir` in its container)
 * actually is on this app's disk, for the files browser and for anything
 * else that has to read a computer's files.
 *
 * A container the app provisioned recorded the directory it bind-mounted
 * (`containers.metadata.data_dir`), which is the truth: on a bind mount
 * that path can be anywhere the docker host allows. A computer the app
 * didn't provision has no record. That is the install's main computer on a
 * server reached at `MAIN_COMPUTER_URL` (a dev server outside docker),
 * whose sandbox keeps its home wherever its compose file says, so
 * `MAIN_COMPUTER_DATA_DIR` names that directory for this app. Without
 * either, the conventional place every app-provisioned computer uses:
 * `DATA_DIR/<AppData.ComputerDataDir>/<id>`.
 *
 * Kept apart from the docker and database calls so the precedence is
 * testable on its own.
 */
export default function resolveComputerHomeDir({
    computer_id,
    kind,
    metadata,
    main_data_dir,
    data_dir,
}: Params) {
    const recorded = parseJobJson({ text: metadata || "" })?.data_dir;

    if (typeof recorded == "string" && recorded.trim()) return path.resolve(recorded.trim());

    const external = kind == "main" ? main_data_dir?.trim() : "";

    if (external) return path.resolve(external);

    return path.join(data_dir, AppData.ComputerDataDir, String(computer_id));
}
