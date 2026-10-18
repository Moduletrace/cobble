export type LogsTableColumn = {
    title: string;
    className?: string;
    hide_title?: boolean;
};

export const LogsTableColumns: LogsTableColumn[] = [
    { title: "Event" },
    { title: "Category" },
    { title: "User", className: "hidden md:table-cell" },
    { title: "IP Address", className: "hidden lg:table-cell" },
    { title: "Time", className: "text-right" },
    { title: "Actions", className: "w-12", hide_title: true },
];
