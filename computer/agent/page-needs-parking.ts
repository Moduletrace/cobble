/**
 * Chrome's own pages (New Tab, settings, error pages, blank tabs) draw
 * next to nothing when they sit still; only sites are worth parking.
 */
const ChromePagePattern = /^(about|chrome|chrome-untrusted|chrome-error|devtools):/i;

/**
 * Whether a tab on show costs anything to keep drawing: a site does (its
 * animations, video and ads run at full rate while it's in front),
 * Chrome's own pages don't.
 */
export default function pageNeedsParking({ url }: { url: string }) {
    return !ChromePagePattern.test(url.trim());
}
