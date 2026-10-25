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
import installDisplayName from "@/src/utils/install-display-name";
import installIconBase from "@/src/utils/install-icon-base";
import Layout from "../layouts/main";
import AuthLayout from "../layouts/auth";
import BotsLayout from "../layouts/bots";
import ThemeInitScript from "../components/general/theme-init-script";
import PwaInitScript from "../components/general/pwa-init-script";
import ServiceWorkerRegistrar from "../components/general/service-worker-registrar";

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
                <ServiceWorkerRegistrar />
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
                <ServiceWorkerRegistrar />
            </AppContext.Provider>
        );
    }

    return (
        <AppContext.Provider value={appContextObject}>
            <Layout
                blank={
                    url?.pathname
                        ? ["/auth/logout"].includes(url.pathname)
                        : undefined
                }
            >
                {children}
            </Layout>
            <ServiceWorkerRegistrar />
        </AppContext.Provider>
    );
}

export function Head({ serverRes, ctx }: BunextPageHeadFCProps) {
    /**
     * iOS names a home-screen app from these tags, not the manifest.
     */
    const root_props = serverRes?.props as PagePropsType | undefined;
    const app_name = installDisplayName({ install_name: root_props?.install_name });
    /**
     * The install's own icon set, when it has one (Settings > General).
     */
    const icon_base = installIconBase({ icon: root_props?.install_icon });

    return (
        <>
            <ThemeInitScript />
            <PwaInitScript />
            <meta name="application-name" content={app_name} />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta
                name="apple-mobile-web-app-title"
                content={app_name}
            />
            <meta
                name="apple-mobile-web-app-status-bar-style"
                content="default"
            />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
                crossOrigin=""
            />
            <link
                href="https://fonts.googleapis.com/css2?family=Archivo:wght@400..900&display=swap"
                rel="stylesheet"
            />
            {icon_base ? null : (
                <link
                    rel="icon"
                    href="/favicon.ico"
                    sizes="16x16 24x24 32x32 48x48"
                />
            )}
            <link
                rel="icon"
                type="image/png"
                sizes="32x32"
                href={icon_base ? `${icon_base}/favicon.png` : "/favicon.png"}
            />
            <link
                rel="apple-touch-icon"
                sizes="180x180"
                href={icon_base ? `${icon_base}/apple-touch-icon.png` : "/apple-touch-icon.png"}
            />
        </>
    );
}
