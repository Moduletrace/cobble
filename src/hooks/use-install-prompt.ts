"use client";

import { useEffect, useState } from "react";

export type InstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
    interface Window {
        /**
         * Captured by `PwaInitScript` before React mounts.
         */
        __cobbleInstallPrompt?: InstallPromptEvent | null;
    }
}

const StandaloneQuery = "(display-mode: standalone)";

function isIosDevice() {
    if (typeof navigator == "undefined") return false;

    const ua = navigator.userAgent;

    return (
        /iphone|ipad|ipod/i.test(ua) ||
        (navigator.platform == "MacIntel" && navigator.maxTouchPoints > 1)
    );
}

/**
 * Whether this browser can install the app now, whether it is already
 * installed, and the iOS steps when Safari has no install event.
 */
export default function useInstallPrompt() {
    const [prompt_event, setPromptEvent] = useState<InstallPromptEvent | null>(
        null,
    );
    const [is_standalone, setIsStandalone] = useState(false);
    const [is_ios, setIsIos] = useState(false);
    const [installing, setInstalling] = useState(false);

    useEffect(() => {
        if (typeof window == "undefined") return;

        const standalone_query = window.matchMedia(StandaloneQuery);
        const sync_standalone = () =>
            setIsStandalone(
                standalone_query.matches ||
                    Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
            );

        setPromptEvent(window.__cobbleInstallPrompt || null);
        setIsIos(isIosDevice());
        sync_standalone();

        const sync_prompt = () =>
            setPromptEvent(window.__cobbleInstallPrompt || null);
        const on_installed = () => {
            window.__cobbleInstallPrompt = null;
            setPromptEvent(null);
            sync_standalone();
        };

        window.addEventListener("cobble:install-available", sync_prompt);
        window.addEventListener("cobble:installed", on_installed);
        standalone_query.addEventListener("change", sync_standalone);

        return () => {
            window.removeEventListener("cobble:install-available", sync_prompt);
            window.removeEventListener("cobble:installed", on_installed);
            standalone_query.removeEventListener("change", sync_standalone);
        };
    }, []);

    const install = async () => {
        if (!prompt_event) return false;

        setInstalling(true);

        try {
            await prompt_event.prompt();
            const choice = await prompt_event.userChoice;
            window.__cobbleInstallPrompt = null;
            setPromptEvent(null);

            return choice.outcome == "accepted";
        } catch (error) {
            return false;
        } finally {
            setInstalling(false);
        }
    };

    return {
        can_install: Boolean(prompt_event) && !is_standalone,
        is_standalone,
        is_ios,
        /**
         * Safari has no install event, so it needs the Share menu steps.
         */
        needs_ios_steps: is_ios && !is_standalone,
        installing,
        install,
    };
}
