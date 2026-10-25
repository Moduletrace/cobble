import { useContext } from "react";
import Tag from "@moduletrace/twui/elements/Tag";
import { DataBackupRunContext } from "../(data)/data-backup-run-context";

/**
 * One line under the data archives' actions: the archive or restore
 * running now, else why the last one failed. Nothing when neither, so the
 * actions row keeps its layout either way.
 */
export default function DataBackupRunNotice() {
    const { run, error } = useContext(DataBackupRunContext);

    if (run?.kind == "archive") {
        return <Tag color="gray">Archiving, this can take a while...</Tag>;
    }

    if (run?.kind == "restore") {
        return <Tag color="warning">Restoring, the app restarts soon...</Tag>;
    }

    if (error) {
        return <Tag color="error">{error}</Tag>;
    }

    return null;
}
