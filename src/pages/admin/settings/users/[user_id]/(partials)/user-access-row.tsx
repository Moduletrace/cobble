import type { ReactNode } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Link from "@moduletrace/twui/layout/Link";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { X } from "lucide-react";

export type UserAccessItem = {
    id: number;
    name: string;
    subtitle?: string | null;
    /**
     * Its settings page.
     */
    href: string;
    avatar: ReactNode;
};

type Props = UserAccessItem & {
    /**
     * What it is, e.g. "bot", for the remove button's title.
     */
    noun: string;
    removing?: boolean;
    onRemove: () => void;
};

/**
 * A worker or workspace the user reaches: opens its settings, or takes it
 * away from them.
 */
export default function UserAccessRow({ name, subtitle, href, avatar, noun, removing, onRemove }: Props) {
    return (
        <Row className="w-full min-h-14 gap-3! flex-nowrap items-center px-3 py-2">
            {avatar}
            <Link
                href={href}
                title={`${name}'s settings`}
                className="grow min-w-0 flex flex-col border-0 leading-normal hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ink rounded-default-sm"
            >
                <Span className="text-sm font-bold leading-5 text-ink truncate w-full">{name}</Span>
                {subtitle ? (
                    <Span className="text-xs leading-4 text-ink-secondary truncate w-full">{subtitle}</Span>
                ) : null}
            </Link>
            <Button
                title={`Take this ${noun} away from them`}
                aria-label={`Take ${name} away from them`}
                type="button"
                variant="ghost"
                color="text"
                loading={removing}
                disabled={removing}
                onClick={onRemove}
                className="shrink-0 p-2! text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken rounded-default"
            >
                <X size={16} aria-hidden />
            </Button>
        </Row>
    );
}
