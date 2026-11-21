import { useState } from "react";

/**
 * Which rows of a settings list a bundle export would take: ids picked with
 * the boxes beside each row, all of them, or none.
 */
export default function useExtensionSelection() {
    const [selected, setSelected] = useState<number[]>([]);

    return {
        selected,
        has: ({ id }: { id: number }) => selected.includes(id),
        toggle: ({ id, checked }: { id: number; checked: boolean }) =>
            setSelected((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((candidate) => candidate != id))),
        all: ({ ids }: { ids: number[] }) => setSelected(ids),
        clear: () => setSelected([]),
    };
}