export type HeroSpec = {
    label: string;
    value: string;
};

export const HeroSpecs: HeroSpec[] = [
    { label: "Runtime", value: "Bun" },
    { label: "Database", value: "SQLite" },
    { label: "Routing", value: "Filesystem" },
    { label: "Interface", value: "Tailwind v4 + twui" },
];
