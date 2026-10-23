type Params = {
    /**
     * The name the file was uploaded with.
     */
    name: string;
    /**
     * Its `media` id.
     */
    id: number | string;
};

/**
 * How an upload is described to the model: its name and its media id, e.g.
 * `"summit-logo.png", media id 42`.
 *
 * The id matters: the picture tools (`set_picture`, `update_workspace`)
 * take an upload by media id, so a bot that can read the id can act on the
 * image the user sent instead of asking them to upload it again.
 */
export default function describeAttachment({ name, id }: Params) {
    return `"${name}", media id ${id}`;
}
