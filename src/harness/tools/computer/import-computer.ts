type ComputerLike = {
    id?: number | string | null;
    name?: string | null;
};

/**
 * Which computer an import reads from: the one the bot named (an id, or a
 * `computer:<id>` ref), else the first it has. Null when it named one it
 * does not have, so the tool says so instead of reading the wrong machine.
 */
export default function pickImportComputer<T extends ComputerLike>({
    computers,
    wanted,
}: {
    computers: T[];
    wanted?: number | string | null;
}): T | null {
    if (!computers.length) return null;

    if (wanted === undefined || wanted === null || String(wanted).trim() == "") return computers[0] ?? null;

    const id = Number(String(wanted).trim().replace(/^computer:/, ""));
    if (!Number.isFinite(id)) return null;

    return computers.find((computer) => Number(computer.id) == id) ?? null;
}