/**
 * A subscription's user agent as a short device label for the settings
 * list, e.g. "Chrome on Android". Unknown parts are left out.
 */
export default function describePushDevice({
    user_agent,
    platform,
}: {
    user_agent?: string | null;
    platform?: string | null;
}): string {
    const ua = user_agent || "";

    const browser = /Edg\//.test(ua)
        ? "Edge"
        : /OPR\/|Opera/.test(ua)
          ? "Opera"
          : /Firefox\/|FxiOS/.test(ua)
            ? "Firefox"
            : /CriOS/.test(ua)
              ? "Chrome"
              : /Chrome\//.test(ua)
                ? "Chrome"
                : /Safari\//.test(ua)
                  ? "Safari"
                  : "";

    const device = /iPhone/.test(ua)
        ? "iPhone"
        : /iPad/.test(ua)
          ? "iPad"
          : /Android/.test(ua)
            ? "Android"
            : /Windows/.test(ua)
              ? "Windows"
              : /Macintosh|Mac OS X/.test(ua)
                ? "Mac"
                : /Linux/.test(ua)
                  ? "Linux"
                  : platform
                    ? platform.charAt(0).toUpperCase() + platform.slice(1)
                    : "";

    if (browser && device) return `${browser} on ${device}`;
    if (browser) return browser;
    if (device) return device;

    return "A browser";
}
