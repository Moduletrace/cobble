export type DataBackupsTableColumn = {
    title: string;
    className?: string;
    hide_title?: boolean;
};

export const DataBackupsTableColumns: DataBackupsTableColumn[] = [
    { title: "Archive" },
    { title: "Created" },
    { title: "Size", className: "hidden md:table-cell" },
    { title: "Actions", className: "text-right", hide_title: true },
];
