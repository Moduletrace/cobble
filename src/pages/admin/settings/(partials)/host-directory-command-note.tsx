import { useState } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import SettingsRowAction from "./settings-row-action";

type Props = {
    command: string;
};

/**
 * The command that gives the bots' accounts access to a folder on the host
 * machine by hand. Cobble gives it to them itself when the folder is linked,
 * so this is only shown once that failed, for a host whose folder refuses
 * the entries or a machine Cobble can't reach.
 */
export default function HostDirectoryCommandNote({ command }: Props) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        await navigator.clipboard.writeText(command).catch(() => {});
        setCopied(true);
    };

    return (
        <Stack className="w-full gap-1! items-stretch rounded-default-sm border border-solid border-hairline bg-sunken px-2 py-1.5">
            <Span className="text-[12px] leading-4 text-ink-secondary">
                Cobble couldn't give the bots access to this folder. On the
                host machine, run this as the folder's owner, then check
                again:
            </Span>
            <Row className="w-full gap-2! flex-nowrap items-start">
                <Span className="grow min-w-0 font-mono text-[12px] leading-4 text-ink select-all break-all">
                    {command}
                </Span>
                <SettingsRowAction
                    title="Copy the command"
                    label={copied ? "Copied" : "Copy"}
                    onClick={copy}
                />
            </Row>
        </Stack>
    );
}