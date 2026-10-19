import webpush from "web-push";
import { SiteData } from "@/src/data/site-data";
import grabAllEnvs from "@/src/functions/backend/db/envs/grab-all-envs";
import grabEnv from "@/src/functions/backend/db/envs/grab-env";
import saveEnv from "@/src/functions/backend/db/envs/save-env";
import deleteEnv from "@/src/functions/backend/db/envs/delete-env";
import { logError } from "@/src/functions/backend/logger";

export type VapidKeys = {
    public_key: string;
    private_key: string;
};

let configured_for: string | undefined;

/**
 * The install's Web Push key pair, from the Environment settings. The
 * first server that starts generates it, so push works without setup;
 * a super admin can replace it in Settings.
 *
 * A pair must match, so when either half is missing both are generated
 * and the stray half is replaced. Not part of a request path's
 * correctness: a failure to read or save only means no notifications
 * until it is fixed.
 */
export async function ensureVapidKeys(): Promise<VapidKeys | null> {
    const public_key = await grabEnv({ key: "VAPID_PUBLIC_KEY" });
    const private_key = await grabEnv({ key: "VAPID_PRIVATE_KEY" });

    if (public_key && private_key) {
        return { public_key, private_key };
    }

    const generated = webpush.generateVAPIDKeys();

    /**
     * A saved half would clash with the new one (`saveEnv` allows one row
     * per key), and a mismatched pair can't sign.
     */
    const saved = await grabAllEnvs();
    const stale = saved.filter(
        (env) =>
            env.paradigm == "general" &&
            (env.key == "VAPID_PUBLIC_KEY" || env.key == "VAPID_PRIVATE_KEY"),
    );

    for (const env of stale) {
        await deleteEnv({ env_id: env.id });
    }

    await saveEnv({
        user_id: 0,
        key: "VAPID_PUBLIC_KEY",
        value: generated.publicKey,
        paradigm: "general",
        secret: false,
        expose_to_computers: false,
    });

    await saveEnv({
        user_id: 0,
        key: "VAPID_PRIVATE_KEY",
        value: generated.privateKey,
        paradigm: "general",
        secret: true,
        expose_to_computers: false,
    });

    const saved_public = await grabEnv({ key: "VAPID_PUBLIC_KEY" });
    const saved_private = await grabEnv({ key: "VAPID_PRIVATE_KEY" });

    if (!saved_public || !saved_private) return null;

    return { public_key: saved_public, private_key: saved_private };
}

/**
 * `web-push` keeps the details globally; set them when the pair changes.
 */
export async function configureWebPush(): Promise<VapidKeys | null> {
    const keys = await ensureVapidKeys().catch(async (error) => {
        await logError({ title: "Could not load Web Push keys", error }).catch(
            () => {},
        );
        return null;
    });

    if (!keys) return null;

    const fingerprint = `${keys.public_key}:${keys.private_key}`;

    if (configured_for != fingerprint) {
        webpush.setVapidDetails(
            SiteData["SiteURL"],
            keys.public_key,
            keys.private_key,
        );
        configured_for = fingerprint;
    }

    return keys;
}
