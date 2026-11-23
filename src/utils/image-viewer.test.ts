import { expect, test } from "bun:test";
import { ImageViewerMaxScale, ImageViewerMinScale } from "@/src/dict/image-viewer-dict";
import imageViewerClampScale from "./image-viewer-clamp-scale";
import imageViewerFitScale from "./image-viewer-fit-scale";
import imageViewerPresetStep from "./image-viewer-preset-step";
import imageViewerZoomStep from "./image-viewer-zoom-step";

const frame = { width: 1000, height: 800 };

test("fit shows a big picture whole and never enlarges a small one", () => {
    expect(imageViewerFitScale({ mode: "fit", natural: { width: 2000, height: 1000 }, frame })).toBe(0.5);
    expect(imageViewerFitScale({ mode: "fit", natural: { width: 1000, height: 1600 }, frame })).toBe(0.5);
    expect(imageViewerFitScale({ mode: "fit", natural: { width: 200, height: 100 }, frame })).toBe(1);
});

test("fit width fills the frame's width whatever the height", () => {
    expect(imageViewerFitScale({ mode: "width", natural: { width: 2880, height: 20000 }, frame })).toBeCloseTo(1000 / 2880);
    expect(imageViewerFitScale({ mode: "width", natural: { width: 400, height: 20000 }, frame })).toBe(1);
    expect(imageViewerFitScale({ mode: "actual", natural: { width: 2880, height: 20000 }, frame })).toBe(1);
});

test("Tab steps through the presets and round, a zoomed view starting at fit", () => {
    expect(imageViewerPresetStep({ mode: "fit" })).toBe("width");
    expect(imageViewerPresetStep({ mode: "width" })).toBe("actual");
    expect(imageViewerPresetStep({ mode: "actual" })).toBe("fit");
    expect(imageViewerPresetStep({ mode: "custom" })).toBe("fit");
});

test("zoom steps move to the next stop and stay in range", () => {
    expect(imageViewerZoomStep({ scale: 0.37, direction: "in" })).toBe(0.5);
    expect(imageViewerZoomStep({ scale: 0.37, direction: "out" })).toBe(0.33);
    expect(imageViewerZoomStep({ scale: 1, direction: "in" })).toBe(1.25);
    expect(imageViewerZoomStep({ scale: ImageViewerMaxScale, direction: "in" })).toBe(ImageViewerMaxScale);
    expect(imageViewerZoomStep({ scale: ImageViewerMinScale, direction: "out" })).toBe(ImageViewerMinScale);
    expect(imageViewerClampScale({ scale: 100 })).toBe(ImageViewerMaxScale);
    expect(imageViewerClampScale({ scale: Number.NaN })).toBe(1);
});
