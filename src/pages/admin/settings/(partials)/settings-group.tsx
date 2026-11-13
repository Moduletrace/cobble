import { useContext, type ReactNode } from "react";
import Link from "@moduletrace/twui/layout/Link";
import Stack from "@moduletrace/twui/layout/Stack";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import { ArrowRight } from "lucide-react";
import { AppContext } from "@/src/pages/__root";
import { GeneralSettingsRoot, findGeneralSettingsSection } from "@/src/dict/general-settings-dict";

type Props = {
    title: string;
    description?: ReactNode;
    children: ReactNode;
    /**
     * An anchor, so a link can open the page at this block.
     */
    id?: string;
};

/**
 * One block of settings: what it is on the left, the controls on the right.
 * Stacks below 768px. Blocks are separated by hairlines, never cards.
 *
 * A group that has a page of its own (the one a bot's setting ref opens)
 * links to it, unless this is already that page.
 */
export default function SettingsGroup({ title, description, children, id }: Props) {
    const { pageProps } = useContext(AppContext);
    const section = findGeneralSettingsSection({ key: id });
    const href = section ? `${GeneralSettingsRoot}/${section.key}` : null;
    const on_own_page = href ? pageProps?.url?.pathname == href : false;

    return (
        <Stack id={id} className="w-full scroll-mt-4 gap-4! md:grid md:grid-cols-[200px_1fr] md:gap-10! py-8 border-0 border-b border-solid border-hairline last:border-b-0">
            <Stack className="gap-1! min-w-0">
                <H2 className="text-sm! leading-5! tracking-normal! font-bold text-ink mb-0!">
                    {title}
                </H2>
                {description ? (
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">
                        {description}
                    </Span>
                ) : null}
                {href && !on_own_page ? (
                    <Link
                        href={href}
                        className="inline-flex w-fit items-center gap-1 text-[13px] leading-[18px] font-bold text-ink-secondary hover:text-ink"
                    >
                        {`Open ${section?.title || title}`}
                        <ArrowRight size={13} aria-hidden className="shrink-0" />
                    </Link>
                ) : null}
            </Stack>
            <Stack className="gap-4! min-w-0 w-full items-stretch">
                {children}
            </Stack>
        </Stack>
    );
}
