import Paper from "@moduletrace/twui/elements/Paper";
import type { DataBackup } from "@/src/types";
import { DataBackupsTableColumns } from "../(data)/data-backups-table-columns";
import DataBackupTableRow from "./data-backup-table-row";
import DataBackupsTableHeadCell from "./data-backups-table-head-cell";

type Props = {
    backups: DataBackup[];
};

export default function DataBackupsTable({ backups }: Props) {
    return (
        <Paper className="p-0 gap-0 overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/5">
                    <tr>
                        {DataBackupsTableColumns.map((column) => (
                            <DataBackupsTableHeadCell
                                {...column}
                                key={column.title}
                            />
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {backups.map((backup) => (
                        <DataBackupTableRow backup={backup} key={backup.name} />
                    ))}
                </tbody>
            </table>
        </Paper>
    );
}
