type Params = {
    url: string;
    focus?: string;
};

/**
 * Where a run's media cache keeps an image's reading: the same image read
 * for another focus is another reading.
 */
export default function imageReadingKey({ url, focus }: Params) {
    return `image:${Bun.hash(`${focus || ""}\n${url}`)}`;
}
