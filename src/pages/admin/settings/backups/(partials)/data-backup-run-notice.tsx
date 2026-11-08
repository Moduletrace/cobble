import { useContext } from "react";
import Tag from "@moduletrace/twui/elements/Tag";
import { DataBackupRunContext } from "../(data)/data-backup-run-context";
import type { DataBackupRunKind } from "@/src/types";

type Props = {
    /**
     * True under the database snapshots, which show only a snapshot
     * restore; the data archives show the rest.
     */
    database?: boolean;
};

/**
 * One line under a list's actions: the run of its own kind going now,
 * else why the last one failed. Nothing when neither, so the actions row
 * keeps its layout either way.
 */
export default function DataBackupRunNotice({ database }: Props) {
    const { run, error, error_kind } = useContext(DataBackupRunContext);

    const isMine = (kind?: DataBackupRunKind) =>
        database ? kind == "db_restore" : kind != "db_restore";

    if (run && isMine(run.kind)) {
        if (run.kind == "archive") {
            return <Tag color="gray">Archiving, this can take a while...</Tag>;
        }

        return <Tag color="warning">Restoring, the app restarts soon...</Tag>;
    }

    if (error && isMine(error_kind)) {
        return <Tag color="error">{error}</Tag>;
    }

    return null;
}
