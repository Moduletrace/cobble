import syncAppNetworks from "@/src/functions/backend/docker/sync-app-networks";

/**
 * Puts the app's container back on its extra docker networks
 * (`syncAppNetworks`): a network removed and made again, say by another
 * compose stack restarting, drops the app without a word.
 */
export default async function cronSyncAppNetworks() {
    await syncAppNetworks();
}
