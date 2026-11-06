import { expect, test } from "bun:test";
import galleryIndex from "./gallery-index";
import imagePreviewGallery from "./image-preview-gallery";

const items = [
    { name: "notes.md", url: "/media/1" },
    { name: "shot-1.png", url: "/media/2" },
    { name: "raw", url: "" },
    { name: "photo", url: "/media/3", media_type: "image" },
    { name: "clip.mp4", url: "/media/4" },
    { name: "logo.svg", url: "/media/5" },
];

test("a gallery keeps only the images, in the folder's order", () => {
    expect(imagePreviewGallery({ items }).map((item) => item.url)).toEqual(["/media/2", "/media/3", "/media/5"]);
});

test("a file is found in its gallery by its URL", () => {
    const gallery = imagePreviewGallery({ items });

    expect(galleryIndex({ gallery, url: "/media/3" })).toBe(1);
    expect(galleryIndex({ gallery, url: "/media/1" })).toBe(-1);
    expect(galleryIndex({ gallery: undefined, url: "/media/3" })).toBe(-1);
});
