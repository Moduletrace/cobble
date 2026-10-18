import H1 from "@moduletrace/twui/layout/H1";
import Section from "@moduletrace/twui/layout/Section";
import { useContext, type ReactNode } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Breadcrumbs from "@moduletrace/twui/elements/Breadcrumbs";
import { AppContext } from "@/src/pages/__root";
import Span from "@moduletrace/twui/layout/Span";

type Props = {
    title: string;
    description?: string | ReactNode;
    buttons?: ReactNode;
};

export default function AdminHero({ title, description, buttons }: Props) {
    const { pageProps } = useContext(AppContext);

    return (
        <Section className="pb-0! pt-10! xl:pt-14!">
            <Stack className="w-full items-stretch gap-0!">
                <Breadcrumbs
                    currentLinkProps={{
                        className: "text-slate-400! pointer-events-none",
                    }}
                    pageUrl={pageProps?.url?.pathname}
                    backButton
                    skipHome
                />
                <Row className="w-full justify-between items-end gap-6! mt-6 pb-8 border-b border-slate-200 dark:border-white/10">
                    <Stack className="gap-3! max-w-2xl">
                        <H1>{title}</H1>
                        {description ? (
                            typeof description == "string" ? (
                                <Span className="text-slate-500 dark:text-slate-400 text-[15px] leading-relaxed">
                                    {description}
                                </Span>
                            ) : (
                                description
                            )
                        ) : null}
                    </Stack>
                    {buttons ? <Row className="gap-2!">{buttons}</Row> : null}
                </Row>
            </Stack>
        </Section>
    );
}
