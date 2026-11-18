import { CircleAlert } from "lucide-react";
import Link from "@moduletrace/twui/layout/Link";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import {
    HostDirectoryAccesses,
    type HostDirectoryAccess,
    type HostDirectoryCheckState,
} from "@/src/dict/host-directory-dict";
import SettingsRowAction from "../../(partials)/settings-row-action";
import HostDirectoryCheckTag from "../../(partials)/host-directory-check-tag";
import HostDirectoryCommandNote from "../../(partials)/host-directory-command-note";

type Props = {
    /**
     * The computer or workspace it is mounted in.
     */
    name: string;
    href: string;
    access: HostDirectoryAccess;
    state: HostDirectoryCheckState;
    checked_at?: number | null;
    /**
     * What to run on the host machine when the bots can't write there.
     */
    command?: string;
    /**
     * A bot that sees the folder now wasn't there when it was last checked.
     */
    stale?: boolean;
    /**
     * Why the last check couldn't say anything about it.
     */
    error?: string | null;
    busy?: boolean;
    checking?: boolean;
    granting?: boolean;
    onCheck?: () => void;
    /**
     * Gives every bot that sees the folder access to it again, for when
     * giving it access by itself did not work.
     */
    onGrant?: () => void;
    onAccess: () => void;
    onRemove: () => void;
};

/**
 * One place a host directory is mounted: a computer, or a workspace (on
 * every computer it is on), what its bots can do there, and what the last
 * check found.
 */
export default function HostDirectoryLinkRow({
    name,
    href,
    access,
    state,
    checked_at,
    command,
    stale,
    error,
    busy,
    checking,
    granting,
    onCheck,
    onGrant,
    onAccess,
    onRemove,
}: Props) {
    const access_title =
        HostDirectoryAccesses.find((item) => item.value == access)?.title ||
        "Read and write";

    return (
        <Stack className="w-full gap-1! items-stretch border-t border-solid border-hairline py-1.5 first:border-t-0">
            <Row className="w-full gap-x-2 gap-y-1! flex-wrap items-center">
                <Link
                    href={href}
                    title={name}
                    className="min-w-0 truncate text-[13px] leading-[18px] text-ink hover:underline"
                >
                    {name}
                </Link>
                <Span className="shrink-0 text-[12px] leading-4 text-ink-secondary">
                    {access_title}
                </Span>
                <HostDirectoryCheckTag state={state} checked_at={checked_at} />
                <Row className="ml-auto shrink-0 gap-1! flex-nowrap">
                    {onGrant && access == "read-write" && (stale || state == "partial" || state == "read-only") ? (
                        <SettingsRowAction
                            title="Give every bot that sees this folder access to it"
                            label={granting ? "Giving access" : "Give access"}
                            disabled={busy || checking || granting}
                            onClick={onGrant}
                        />
                    ) : null}
                    {onCheck ? (
                        <SettingsRowAction
                            title="Check that the bots can read and write it now"
                            label={checking ? "Checking" : "Check"}
                            disabled={busy || checking}
                            onClick={onCheck}
                        />
                    ) : null}
                    <SettingsRowAction
                        title={
                            access == "read-write"
                                ? "Mount it read only, so the bots can't change it"
                                : "Let the bots write there"
                        }
                        label={
                            access == "read-write"
                                ? "Read only"
                                : "Read and write"
                        }
                        disabled={busy || checking}
                        onClick={onAccess}
                    />
                    <SettingsRowAction
                        title={`Unmount it from ${name}`}
                        label="Remove"
                        disabled={busy || checking}
                        onClick={onRemove}
                    />
                </Row>
            </Row>
            {error ? (
                <Span
                    role="alert"
                    className="flex items-center gap-1.5 text-[12px] leading-4 text-ink"
                >
                    <CircleAlert size={14} aria-hidden className="shrink-0" />
                    Couldn't check it: {error}
                </Span>
            ) : null}
            {stale && !error ? (
                <Span
                    role="status"
                    className="flex items-center gap-1.5 text-[12px] leading-4 text-ink-secondary"
                >
                    <CircleAlert size={14} aria-hidden className="shrink-0" />
                    A bot was added since the last check, so its account
                    hasn't been tested. Check again.
                </Span>
            ) : null}
            {command ? (
                <HostDirectoryCommandNote command={command} />
            ) : null}
        </Stack>
    );
}