import Span from "@moduletrace/twui/layout/Span";
import formatBytes from "@/src/utils/format-bytes";
import type { DbBackup } from "@/src/types";
import dayjs from "dayjs";
import type { BackupsTableMode } from "./backups-table";
import DownloadBackupButton from "./download-backup-button";
import RestoreBackupButton from "./restore-backup-button";

type Props = {
    backup: DbBackup;
    mode: BackupsTableMode;
};

export default function BackupTableRow({ backup, mode }: Props) {
    return (
        <tr className="border-t border-slate-200 dark:border-white/10">
            <td className="px-4 py-2.5 max-w-0 w-full">
                <Span
                    size="small"
                    className="block truncate font-mono"
                    title={backup.name}
                >
                    {backup.name}
                </Span>
            </td>
            <td className="px-4 py-2.5 whitespace-nowrap">
                <Span size="small">
                    {dayjs(backup.created_at).format("MMM D, YYYY HH:mm:ss")}
                </Span>
            </td>
            <td className="hidden md:table-cell px-4 py-2.5 whitespace-nowrap">
                <Span size="small" variant="faded">
                    {formatBytes({ bytes: backup.size })}
                </Span>
            </td>
            <td className="px-4 py-2 text-right whitespace-nowrap">
                {mode == "restore" ? (
                    <RestoreBackupButton backup={backup} />
                ) : (
                    <DownloadBackupButton backup={backup} />
                )}
            </td>
        </tr>
    );
}
