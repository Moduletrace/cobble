import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import Section from "@moduletrace/twui/layout/Section";
import Loading from "@moduletrace/twui/elements/Loading";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { useEffect } from "react";
import { twMerge } from "tailwind-merge";
import Logo from "@/src/components/general/logo";
import Paper from "@moduletrace/twui/elements/Paper";
import Container from "@moduletrace/twui/layout/Container";
import Center from "@moduletrace/twui/layout/Center";
import { SiteData } from "@/src/data/site-data";
import { clearHarnessCache } from "@/src/utils/harness-cache";

export default function LogoutPage() {
    useEffect(() => {
        clearHarnessCache();

        setTimeout(() => {
            window.location.pathname = "/auth/login";
        }, 1000);
    }, []);

    return (
        <Section
            className={twMerge(
                "h-dvh w-screen px-0 items-center justify-center",
            )}
        >
            <Center>
                <Paper className="w-auto p-10 items-center">
                    <Logo
                        text_props={{
                            className: "text-dark dark:text-white",
                        }}
                    />
                    <Row>
                        <Loading />
                        <Span>Logging out ...</Span>
                    </Row>
                </Paper>
            </Center>
        </Section>
    );
}

export const meta: BunextPageModuleMeta = {
    title: `Logging Out | ${SiteData["SiteName"]}`,
    description: "You are being logged out and redirected to the login page.",
};
