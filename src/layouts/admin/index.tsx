import React from "react";
import Header from "./(sections)/Header";
import Footer from "./(sections)/Footer";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import AdminAside from "./(partials)/admin-aside";

/* -------------------------------------------------------------------------- */
/*                      Main Layout Functional Component                      */
/* -------------------------------------------------------------------------- */

// Main Layout Component
export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <Row className="w-full items-stretch gap-0! flex-nowrap min-h-screen bg-light dark:bg-black">
            <AdminAside className="hidden xl:flex" />
            <Stack className="grow min-w-0 items-stretch gap-0! xl:py-2 xl:pr-2">
                <Stack className="grow items-stretch gap-0! bg-white dark:bg-background-dark xl:rounded-default-xl xl:border border-slate-200 dark:border-white/10 shadow-sm shadow-slate-900/5 dark:shadow-none">
                    <Header />
                    <main className="grow items-start" id="admin-main">
                        {children}
                    </main>
                    <Footer />
                </Stack>
            </Stack>
        </Row>
    );
}
