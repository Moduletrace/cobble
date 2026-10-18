import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import React from "react";
import Section from "@moduletrace/twui/layout/Section";
import Container from "@moduletrace/twui/layout/Container";
import Stack from "@moduletrace/twui/layout/Stack";
import H1 from "@moduletrace/twui/layout/H1";
import Span from "@moduletrace/twui/layout/Span";
import Button from "@moduletrace/twui/layout/Button";
import { Home } from "lucide-react";
import { SiteData } from "@/src/data/site-data";

export default function NotFoundPage() {
    return (
        <>
            <Section className="min-h-[70vh] flex items-center">
                <Container>
                    <Stack className="w-full items-center text-center gap-6">
                        <Span className="text-8xl font-bold text-primary dark:text-primary-dark">
                            404
                        </Span>
                        <H1 className="text-center">
                            Page Not Found
                        </H1>
                        <Span className="text-lg max-w-md text-center opacity-70 text-slate-500 dark:text-slate-400">
                            The page you are looking for does not exist or has
                            been moved.
                        </Span>
                        <Button
                            title="Go Home"
                            href="/"
                            beforeIcon={<Home size={17} />}
                        >
                            Back to Home
                        </Button>
                    </Stack>
                </Container>
            </Section>
        </>
    );
}

export const meta: BunextPageModuleMeta = {
    title: `404 | ${SiteData["SiteName"]}`,
    description: "Page not found",
};