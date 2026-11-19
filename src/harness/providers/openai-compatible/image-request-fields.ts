/**
 * How a provider's image call takes a size the tool named as `1024x1024`.
 * Each provider gets only the field it documents: OpenAI's `size`, xAI's
 * `aspect_ratio` (it rejects `size` outright), Alibaba's `width*height`.
 */
export type ImageRequestFields = {
    size?: string;
    aspect_ratio?: string;
};

type Params = {
    provider_kind: string;
    size?: string;
};

const PixelSize = /^(\d+)\s*[x*]\s*(\d+)$/i;

export default function imageRequestFields({ provider_kind, size }: Params): ImageRequestFields {
    if (!size?.trim()) return {};

    if (provider_kind == "xai") {
        const aspect_ratio = xaiAspectRatio({ size });

        return aspect_ratio ? { aspect_ratio } : {};
    }

    return { size };
}

/**
 * xAI takes a named ratio, never a pixel size. An exact pair maps; a size
 * it has no ratio for is left out, which is better than a 400.
 */
function xaiAspectRatio({ size }: { size: string }): string | undefined {
    const pair = size.trim().match(PixelSize);

    if (!pair) return undefined;

    const width = Number(pair[1]);
    const height = Number(pair[2]);

    if (!width || !height) return undefined;

    const ratio = width / height;
    const known: [number, string][] = [
        [1, "1:1"],
        [16 / 9, "16:9"],
        [9 / 16, "9:16"],
        [4 / 3, "4:3"],
        [3 / 4, "3:4"],
        [3 / 2, "3:2"],
        [2 / 3, "2:3"],
        [21 / 9, "21:9"],
        [9 / 21, "9:21"],
    ];
    const match = known.find(([value]) => Math.abs(ratio - value) < 0.02);

    return match?.[1];
}
