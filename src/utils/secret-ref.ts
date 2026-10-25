type Params = {
    id: number | string;
};

/**
 * How a bot shows the user a secret without ever holding its value:
 * `[secret:12]`, the id of the env it's saved as. The chat shows it as a
 * masked chip whose Reveal and Copy fetch the value for whoever may see
 * it (`canRevealEnv`).
 */
export default function secretRef({ id }: Params) {
    return `[secret:${id}]`;
}
