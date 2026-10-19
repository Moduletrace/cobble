import { useState } from "react";
import Input from "@moduletrace/twui/form/Input";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { WorkspaceWithActivity } from "@/src/types";
import AddModalShell from "./add-modal-shell";
import AllWorkspacesRow from "./all-workspaces-row";

type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
    workspaces: WorkspaceWithActivity[];
};

/**
 * Every workspace, latest activity first, with a search by name or
 * description. A workspace opens its page.
 */
export default function AllWorkspacesModal({ open, setOpen, workspaces }: Props) {
    const [query, setQuery] = useState("");
    const search = query.trim().toLowerCase();
    const found = search
        ? workspaces.filter((workspace) =>
              `${workspace.name} ${workspace.description || ""}`.toLowerCase().includes(search),
          )
        : workspaces;

    return (
        <AddModalShell open={open} setOpen={setOpen} title="Workspaces" description={`${workspaces.length} in all.`}>
            <Input
                id="all-workspaces-search"
                title="Search workspaces"
                placeholder="Search by name or description"
                autoComplete="off"
                defaultValue={query}
                onChange={(e) => setQuery(e.target.value)}
                wrapperWrapperProps={{ className: "mt-4" }}
            />
            <Stack className="w-full mt-2 max-h-[60vh] overflow-y-auto gap-0! items-stretch">
                {found.map((workspace) => (
                    <AllWorkspacesRow key={workspace.id} workspace={workspace} />
                ))}
                {found.length ? null : (
                    <Span className="px-3 py-6 text-[13px] leading-[18px] text-ink-secondary">
                        No workspace matches "{query.trim()}".
                    </Span>
                )}
            </Stack>
        </AddModalShell>
    );
}
