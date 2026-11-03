type Params = {
    /**
     * A text harness setting's options.
     */
    options?: Record<string, unknown>;
};

/**
 * Whether the text harness setting lets its model look at images itself
 * (attachments, screenshots, image files) when the model takes image
 * input. Off by default: images are read by the media reading harness.
 */
export default function textSeesImages({ options }: Params) {
    return options?.sees_images === true;
}
