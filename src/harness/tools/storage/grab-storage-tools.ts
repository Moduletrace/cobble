import type { HarnessTool } from "../../types";
import copyFileTool from "./copy-file-tool";
import deleteFileTool from "./delete-file-tool";
import listFilesTool from "./list-files-tool";
import moveFileTool from "./move-file-tool";
import readFileTool from "./read-file-tool";
import type { StorageToolContext } from "./storage-tool-context";
import writeFileTool from "./write-file-tool";

/**
 * The file tools a bot works with on every run, bound to its own
 * directories (and, for the coordinator, every bot's and workspace's).
 * `copy_file` only shows when the run reaches more than one directory.
 */
export default function grabStorageTools(context: StorageToolContext): HarnessTool[] {
    return [
        listFilesTool(context),
        readFileTool(context),
        writeFileTool(context),
        moveFileTool(context),
        deleteFileTool(context),
        ...(context.scopes.length > 1 ? [copyFileTool(context)] : []),
    ];
}
