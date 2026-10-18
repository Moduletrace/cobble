import Paper from "@moduletrace/twui/elements/Paper";
import type { DbBackup } from "@/src/types";
import { BackupsTableColumns } from "../(data)/backups-table-columns";
import BackupTableRow from "./backup-table-row";
import BackupsTableHeadCell from "./backups-table-head-cell";

export type BackupsTableMode = "view" | "restore";

type Props = {
    backups: DbBackup[];
    mode: BackupsTableMode;
};

export default function BackupsTable({ backups, mode }: Props) {
    return (
        <Paper className="p-0 gap-0 overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/5">
                    <tr>
                        {BackupsTableColumns.map((column) => (
                            <BackupsTableHeadCell {...column} key={column.title} />
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {backups.map((backup) => (
                        <BackupTableRow
                            backup={backup}
                            mode={mode}
                            key={backup.name}
                        />
                    ))}
                </tbody>
            </table>
        </Paper>
    );
}
