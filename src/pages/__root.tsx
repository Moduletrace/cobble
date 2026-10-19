// @ts-ignore
import "../styles/main.css";

import React from "react";
import type {
    BunextPageHeadFCProps,
    BunextRootComponentProps,
} from "@moduletrace/bunext/types";

import type {
    AppContextObject,
    AppStateObject,
    PagePropsType,
} from "@/src/types";
import { SiteData } from "@/src/data/site-data";
import Layout from "../layouts/main";
import AuthLayout from "../layouts/auth";
import BotsLayout from "../layouts/bots";
import ThemeInitScript from "../components/general/theme-init-script";

export const AppContext = React.createContext<AppContextObject>(
    {} as AppContextObject,
);

/**
 * # NextApp App Root
 * @description Root component for NextApp App (Next.js)
 */
export default function App({
    children,
    props,
    url,
    query,
}: BunextRootComponentProps) {
    const [refresh, setRefresh] = React.useState(0);
    const [appState, setAppState] = React.useState<AppStateObject>({
        likes: null,
    });

    const page_props = props as PagePropsType;

    const appContextObject: AppContextObject = {
        user: page_props?.user || null,
        user_types: page_props?.user_types || null,
        appState,
        setAppState,
        refresh,
        setRefresh,
        SITE_DATA: {
            siteName: SiteData["SiteName"],
        },
        pageProps: { ...props, url },
        query,
    };

    if (url?.pathname.startsWith("/admin")) {
        return (
            <AppContext.Provider value={appContextObject}>
                <BotsLayout>{children}</BotsLayout>
            </AppContext.Provider>
        );
    }

    if (
        url?.pathname.startsWith("/auth") &&
        !url.pathname.startsWith("/auth/logout")
    ) {
        return (
            <AppContext.Provider value={appContextObject}>
                <AuthLayout>{children}</AuthLayout>
            </AppContext.Provider>
        );
    }

    return (
        <AppContext.Provider value={appContextObject}>
            <Layout
                // no_header_divider={
                //     url?.pathname ? ["/"].includes(url.pathname) : undefined
                // }
                blank={
                    url?.pathname
                        ? ["/auth/logout"].includes(url.pathname)
                        : undefined
                }
            >
                {children}
            </Layout>
        </AppContext.Provider>
    );
}

export function Head({ serverRes, ctx }: BunextPageHeadFCProps) {
    return (
        <>
            <ThemeInitScript />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
                crossOrigin=""
            />
            <link
                href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap"
                rel="stylesheet"
            />
            <link
                rel="icon"
                href="/favicon.ico"
                sizes="16x16 24x24 32x32 48x48"
            />
            <link
                rel="icon"
                type="image/png"
                sizes="32x32"
                href="/favicon.png"
            />
            <link
                rel="apple-touch-icon"
                sizes="180x180"
                href="/apple-touch-icon.png"
            />
        </>
    );
}
