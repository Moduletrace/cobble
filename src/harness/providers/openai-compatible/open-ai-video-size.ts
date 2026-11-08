type Params = {
    resolution?: string;
    aspect_ratio?: string;
};

const Large = /^(1080p|1k|2k|4k)$/i;

/**
 * The `size` OpenAI's video API (Sora) takes for an aspect ratio and a
 * resolution: 1280x720 or 720x1280, or 1792x1024 / 1024x1792 from 1080p
 * up. Undefined for anything else, leaving the model's own default.
 */
export default function openAiVideoSize({ resolution, aspect_ratio }: Params) {
    const large = Large.test(resolution || "");

    if (aspect_ratio == "16:9") return large ? "1792x1024" : "1280x720";
    if (aspect_ratio == "9:16") return large ? "1024x1792" : "720x1280";

    return undefined;
}
