import { useEffect } from "react";

/**
 * Starts loading images the user is likely to open next (a gallery's
 * neighbours), so stepping to one shows it at once.
 */
export default function usePreloadImages({ urls }: { urls: string[] }) {
    const key = urls.join("\n");

    useEffect(() => {
        if (typeof Image == "undefined") return;

        const images = urls.filter(Boolean).map((url) => {
            const image = new Image();

            image.decoding = "async";
            image.src = url;

            return image;
        });

        return () => {
            for (const image of images) image.src = "";
        };
    }, [key]);
}
