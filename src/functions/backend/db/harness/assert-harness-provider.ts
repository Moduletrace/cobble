import AppError from "@/src/utils/app-error";
import grabHarnessProviders from "./grab-harness-providers";

type Params = {
    provider_id: number;
};

/**
 * Throws unless the provider exists and is turned on.
 */
export default async function assertHarnessProvider({ provider_id }: Params) {
    const provider = (await grabHarnessProviders({ provider_id }))[0];

    if (!provider?.id || !provider.enabled) {
        throw new AppError(`That provider isn't available. Turn it on in Settings, under Models.`);
    }
}
