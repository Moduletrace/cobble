import mergeFeatureFlags from "./merge-feature-flags";

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
    /**
     * For small hosts: no Mesa in the GPU process (so no WebGL), reduced motion, no
     * smooth scrolling and none of Chrome's background downloads. Pages
     * draw and load with less CPU, but the browser looks less like a plain
     * desktop install.
     */
    lightweight?: boolean;
    extra?: string[];
};

/**
 * Chrome's background work a lightweight browser goes without: on-device
 * model and hint downloads, casting, translate prompts, autofill lookups.
 */
const LightweightDisabledFeatures = [
    "OptimizationGuideModelDownloading",
    "OptimizationHintsFetching",
    "OptimizationTargetPrediction",
    "OptimizationHints",
    "MediaRouter",
    "DialMediaRouteProvider",
    "Translate",
    "AutofillServerCommunication",
];

/**
 * Chrome's flags: a normal headful browser on the virtual screen, its
 * window filling it, its DevTools port on loopback. Nothing that changes
 * what a page sees beyond what a plain desktop install would show (no
 * automation flags: the app attaches over CDP, it never launches it). The
 * basic password store keeps the cookies' key the same in every
 * container, so a profile carried over stays signed in. Feature lists are
 * merged with the extra flags' own, since Chrome reads only one of each.
 */
export default function browserArgs({ profile_dir, cdp_port, screen, scale, lang, accept_lang, sandbox, lightweight = false, extra = [] }: Params) {
    const args = [
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
        ...(lightweight ? lightweightArgs() : desktopGpuArgs()),
        /**
         * The image is updated instead; this keeps Chrome from nagging.
         */
        "--simulate-outdated-no-au=Tue, 31 Dec 2099 23:59:59 GMT",
        `--lang=${lang}`,
        `--accept-lang=${accept_lang}`,
        ...(sandbox ? [] : ["--no-sandbox", "--test-type"]),
        ...extra,
    ];

    return mergeFeatureFlags({ args });
}

/**
 * The GPU flags of an ordinary computer.
 */
function desktopGpuArgs() {
    return [
        /**
         * Without a GPU Chrome would turn WebGL off, which is a glaring
         * tell; with it, WebGL runs on Mesa's software renderer, as on a
         * real Linux box without GPU drivers.
         */
        "--ignore-gpu-blocklist",
        /**
         * ...but compositing the page in software, as Chrome does with
         * the GPU blocklisted: half the CPU of drawing every frame through
         * Mesa, and WebGL still runs (and names Mesa) as before.
         */
        "--disable-gpu-compositing",
    ];
}

/**
 * A lightweight browser's flags: the GPU process stays (Chrome composites
 * in it) but never loads Mesa or LLVM, so WebGL is off; sites that respect reduced motion stop animating, scrolls
 * jump instead of drawing every step, and nothing downloads in the
 * background.
 */
function lightweightArgs() {
    return [
        "--disable-gpu",
        "--force-prefers-reduced-motion",
        "--disable-smooth-scrolling",
        "--disable-component-update",
        `--disable-features=${LightweightDisabledFeatures.join(",")}`,
    ];
}
