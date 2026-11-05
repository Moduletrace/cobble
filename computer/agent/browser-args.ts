type Params = {
    profile_dir: string;
    cdp_port: number;
    screen: { width: number; height: number };
    /**
     * Chrome's device scale factor; 1 leaves the flag out.
     */
    scale: number;
    lang: string;
    accept_lang: string;
    sandbox: boolean;
    extra?: string[];
};

/**
 * Chrome's flags: a normal headful browser on the virtual screen, its
 * window filling it, its DevTools port on loopback. Nothing that changes
 * what a page sees beyond what a plain desktop install would show (no
 * automation flags: the app attaches over CDP, it never launches it). The
 * basic password store keeps the cookies' key the same in every
 * container, so a profile carried over stays signed in.
 */
export default function browserArgs({ profile_dir, cdp_port, screen, scale, lang, accept_lang, sandbox, extra = [] }: Params) {
    return [
        `--user-data-dir=${profile_dir}`,
        `--remote-debugging-port=${cdp_port}`,
        "--password-store=basic",
        "--no-first-run",
        "--no-default-browser-check",
        "--hide-crash-restore-bubble",
        "--window-position=0,0",
        // Chrome reads the window size in scaled units: divided by the
        // scale, the window fills the screen exactly.
        `--window-size=${Math.floor(screen.width / scale)},${Math.floor(screen.height / scale)}`,
        ...(scale == 1 ? [] : [`--force-device-scale-factor=${scale}`]),
        /**
         * Without a GPU Chrome would turn WebGL off, which is a glaring
         * tell; with it, WebGL runs on Mesa's software renderer, as on a
         * real Linux box without GPU drivers.
         */
        "--ignore-gpu-blocklist",
        /**
         * The image is updated instead; this keeps Chrome from nagging.
         */
        "--simulate-outdated-no-au=Tue, 31 Dec 2099 23:59:59 GMT",
        `--lang=${lang}`,
        `--accept-lang=${accept_lang}`,
        ...(sandbox ? [] : ["--no-sandbox", "--test-type"]),
        ...extra,
    ];
}
