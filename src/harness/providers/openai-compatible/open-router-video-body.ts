import type { HarnessVideoParams } from "../../types";

type Params = Pick<
    HarnessVideoParams,
    "prompt" | "duration" | "resolution" | "aspect_ratio" | "images" | "videos" | "audio"
> & {
    model: string;
};

/**
 * The JSON asking OpenRouter's `/videos` for a video. First and last
 * frames go in `frame_images`; reference images and videos to change go in
 * `input_references`. OpenRouter runs a call with frames as image to
 * video and drops the references then, so references are only sent
 * without frames, and a video to change always goes alone with its
 * reference images.
 */
export default function openRouterVideoBody({
    model,
    prompt,
    duration,
    resolution,
    aspect_ratio,
    images = [],
    videos = [],
    audio,
}: Params) {
    const frames = videos.length ? [] : images.filter((image) => image.role != "reference");
    const references = frames.length
        ? []
        : [
              ...images
                  .filter((image) => image.role == "reference" || videos.length)
                  .map((image) => ({ type: "image_url", image_url: { url: image.url } })),
              ...videos.map((url) => ({ type: "video_url", video_url: { url } })),
          ];

    return {
        model,
        prompt,
        ...(duration ? { duration } : {}),
        ...(resolution ? { resolution } : {}),
        ...(aspect_ratio ? { aspect_ratio } : {}),
        ...(typeof audio == "boolean" ? { generate_audio: audio } : {}),
        ...(frames.length
            ? {
                  frame_images: frames.map((image) => ({
                      type: "image_url",
                      image_url: { url: image.url },
                      frame_type: image.role,
                  })),
              }
            : {}),
        ...(references.length ? { input_references: references } : {}),
    };
}
