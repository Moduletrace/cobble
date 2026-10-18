import React from "react";
import { AppContext } from "@/src/pages/__root";
import type { AppContextObject } from "@/src/types";
import Stack from "@moduletrace/twui/layout/Stack";
import Section from "@moduletrace/twui/layout/Section";
import Container from "@moduletrace/twui/layout/Container";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Logo from "@/src/components/general/logo";
import ColorSchemeSelector from "@moduletrace/twui/elements/ColorSchemeSelector";
import { FooterColumns } from "../(data)/footer-columns";
import FooterLinkColumn from "../(partials)/footer-link-column";

export default function Footer() {
    const appContext: AppContextObject = React.useContext(AppContext);

    const { SITE_DATA } = appContext;

    return (
        <footer className="bg-white dark:bg-background-dark border-t border-slate-200 dark:border-white/10">
            <Section className="pt-20! pb-0!">
                <Container>
                    <Stack className="w-full gap-16! items-stretch">
                        <Row className="w-full items-start justify-between gap-14! flex-wrap">
                            <Stack className="gap-5! max-w-md">
                                <Logo icon_size={32} />
                                <Span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                                    A considered starting point for Bun, Bunext
                                    and SQLite applications.
                                </Span>
                            </Stack>

                            <Row className="gap-16! justify-start flex-wrap items-start">
                                {FooterColumns.map((column) => (
                                    <FooterLinkColumn
                                        key={column.label}
                                        {...column}
                                    />
                                ))}
                            </Row>
                        </Row>

                        <Row className="w-full items-center justify-between flex-wrap py-8 gap-4! border-t border-slate-200 dark:border-white/10">
                            <Span className="text-xs text-slate-400 dark:text-slate-500">
                                &copy; {new Date().getFullYear()}{" "}
                                {SITE_DATA.siteName}. All rights reserved.
                            </Span>
                            <Row className="items-center gap-6!">
                                <Span className="text-xs text-slate-400 dark:text-slate-500">
                                    Built with Bunext + SQLite
                                </Span>
                                <ColorSchemeSelector
                                    className="text-slate-500 hover:text-foreground-light dark:text-slate-400 dark:hover:text-foreground-dark transition-colors"
                                    size="small"
                                />
                            </Row>
                        </Row>
                    </Stack>
                </Container>
            </Section>
        </footer>
    );
}
