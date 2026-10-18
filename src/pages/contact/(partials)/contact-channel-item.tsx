import Stack from "@moduletrace/twui/layout/Stack";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Link from "@moduletrace/twui/layout/Link";
import type { ContactChannel } from "../(data)/contact-channels";

type Props = ContactChannel & {
    index: number;
};

export default function ContactChannelItem({
    Icon,
    label,
    value,
    href,
    index,
}: Props) {
    return (
        <Row className="w-full flex-nowrap items-start justify-between gap-6! py-6 border-t border-slate-300 dark:border-white/20">
            <Stack className="gap-2! min-w-0">
                <Span className="text-xs text-slate-400">
                    {String(index + 1).padStart(2, "0")} / {label}
                </Span>
                {href ? (
                    <Link
                        href={href}
                        className="text-lg font-medium tracking-tight text-foreground-light dark:text-foreground-dark border-0 leading-snug break-words hover:text-accent"
                    >
                        {value}
                    </Link>
                ) : (
                    <Span className="text-lg font-medium tracking-tight text-foreground-light dark:text-foreground-dark leading-snug">
                        {value}
                    </Span>
                )}
            </Stack>
            <Icon
                size={20}
                strokeWidth={1.5}
                className="text-slate-400 shrink-0 mt-1"
            />
        </Row>
    );
}
