import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { Monitor } from "lucide-react";
import type { ComputerWithStatus } from "@/src/types";
import computerStatusLabel from "../(utils)/computer-status-label";
import WorkspaceComputerAction from "./workspace-computer-action";

type Props = {
    computer: ComputerWithStatus;
    is_default: boolean;
    is_super_admin: boolean;
    busy?: boolean;
    onMakeDefault: () => void;
    onUnlink: () => void;
    onRetry: () => void;
    onDelete: () => void;
};

/**
 * A computer linked to the workspace: its name, state and whether it's
 * the default, then what can be done with it.
 */
export default function WorkspaceComputerRow({
    computer,
    is_default,
    is_super_admin,
    busy,
    onMakeDefault,
    onUnlink,
    onRetry,
    onDelete,
}: Props) {
    const name = computer.name || `Computer ${computer.id}`;

    return (
        <Row className="w-full min-h-14 gap-3! flex-nowrap items-center px-3 py-2">
            <Span className="size-8 shrink-0 flex items-center justify-center rounded-default-sm border border-solid border-hairline bg-paper">
                <Monitor size={16} aria-hidden />
            </Span>
            <Stack className="grow min-w-0 gap-0!">
                <Span className="text-sm font-bold leading-5 text-ink truncate w-full">
                    {name}
                    {is_default ? <Span className="ml-2 text-[11px] font-bold leading-4 text-ink-secondary">Default</Span> : null}
                </Span>
                <Span className="text-xs leading-4 text-ink-secondary truncate w-full">
                    {computerStatusLabel({ computer })}
                    {computer.description ? ` · ${computer.description}` : ""}
                </Span>
            </Stack>
            <Row className="shrink-0 gap-1! flex-nowrap">
                {is_default ? null : (
                    <WorkspaceComputerAction title={`Make ${name} the default`} label="Make default" disabled={busy} onClick={onMakeDefault} />
                )}
                {computer.status == "failed" && is_super_admin ? (
                    <WorkspaceComputerAction title={`Set ${name} up again`} label="Retry" disabled={busy} onClick={onRetry} />
                ) : null}
                <WorkspaceComputerAction title={`Unlink ${name}; it stays yours`} label="Unlink" disabled={busy} onClick={onUnlink} />
                {is_super_admin && computer.kind != "main" ? (
                    <WorkspaceComputerAction title={`Delete ${name}; its files are kept`} label="Delete" disabled={busy} onClick={onDelete} />
                ) : null}
            </Row>
        </Row>
    );
}
