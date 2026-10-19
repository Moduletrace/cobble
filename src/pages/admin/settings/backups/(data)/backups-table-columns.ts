export type BackupsTableColumn = {
    title: string;
    className?: string;
    hide_title?: boolean;
};

export const BackupsTableColumns: BackupsTableColumn[] = [
    { title: "Backup" },
    { title: "Created" },
    { title: "Size", className: "hidden md:table-cell" },
    { title: "Actions", className: "text-right", hide_title: true },
];
