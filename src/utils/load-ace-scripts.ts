const AceScripts = [
    "https://cdnjs.cloudflare.com/ajax/libs/ace/1.22.0/ace.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/ace/1.22.0/ext-language_tools.min.js",
];

let loading: Promise<void> | undefined;

/**
 * Loads the ACE editor's scripts once per page, in order (the language
 * tools need ACE itself), so only pages with an editor download them.
 * twui's `AceEditor` waits for `window.ace` on its own.
 */
export default function loadAceScripts() {
    if (typeof window == "undefined") return Promise.resolve();

    loading ||= AceScripts.reduce(
        (previous, src) =>
            previous.then(
                () =>
                    new Promise<void>((resolve, reject) => {
                        if (document.querySelector(`script[src="${src}"]`)) return resolve();

                        const script = document.createElement("script");
                        script.src = src;
                        script.onload = () => resolve();
                        script.onerror = () => reject(new Error(`Couldn't load ${src}`));
                        document.head.appendChild(script);
                    }),
            ),
        Promise.resolve(),
    ).catch((error) => {
        loading = undefined;
        throw error;
    });

    return loading;
}
