/**
 * How the image preview sizes a picture: `fit` shows it whole, `width`
 * fills the frame's width and scrolls down (a full-page screenshot),
 * `actual` is one image pixel per screen pixel, `custom` is wherever the
 * user zoomed to. The fits never blow a small picture up past its own size.
 */
export const ImageViewerModes = ["fit", "width", "actual", "custom"] as const;

export type ImageViewerMode = (typeof ImageViewerModes)[number];

/**
 * The stops the zoom buttons (and `+`/`-`) step through, from
 * `ImageViewerMinScale` to `ImageViewerMaxScale`.
 */
export const ImageViewerZoomSteps = [
    0.05, 0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.25, 1.5, 2, 3, 4, 6, 8, 12, 16,
] as const;

export const ImageViewerMinScale = 0.05;

export const ImageViewerMaxScale = 16;

/**
 * A picture this much taller (relative to its width) than the frame opens
 * at the frame's width rather than whole: shrunk to fit, a page screenshot
 * is a thin unreadable strip.
 */
export const ImageViewerTallRatio = 2;
