import grabProposalEnvs from "../extension-proposals/grab-proposal-envs";

type Params = {
    keys: string[];
};

/**
 * The keys a bundle's templates need that nothing in this install fills:
 * an import brings `{{env.KEY}}` with the server, never the value, so a
 * key saved nowhere (or only for one bot) leaves the server unable to run
 * until it's added.
 */
export default async function missingEnvKeys({ keys }: Params): Promise<string[]> {
    if (!keys.length) return [];

    const envs = await grabProposalEnvs({
        sends: [...new Set(keys)].map((key) => ({ key, where: "" })),
    });

    return envs.filter((env) => !env.saved_in.includes("general")).map((env) => env.key);
}