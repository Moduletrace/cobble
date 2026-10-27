import { useEffect, useState } from "react";

function readDark() {
    return typeof document != "undefined" && document.documentElement.classList.contains("dark");
}

/**
 * Whether the page shows the dark theme now (`dark` on the root, set by
 * `ThemeInitScript` and the theme toggles), kept live as it changes.
 */
export default function useDocumentDark() {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        setDark(readDark());

        const observer = new MutationObserver(() => setDark(readDark()));

        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        return () => observer.disconnect();
    }, []);

    return dark;
}
