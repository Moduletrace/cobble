import Span from "@moduletrace/twui/layout/Span";

type Props = {
    command: string;
};

/** A shell command to copy, shown as it should be typed. */
export default function BrowserCommandBlock({ command }: Props) {
    return (
        <Span className="rounded-default bg-sunken p-3 font-mono text-[12px] leading-[18px] text-ink whitespace-pre-wrap break-words">
            {command}
        </Span>
    );
}
