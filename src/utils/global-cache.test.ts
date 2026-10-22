import { describe, expect, test } from "bun:test";
import globalCache from "./global-cache";

describe("globalCache", () => {
    test("keeps a value and clears it", () => {
        const cache = globalCache<number>({ name: "cobble.grabAllEnvs.cache" });

        cache.clear();
        expect(cache.get()).toBeUndefined();

        cache.set(7);
        expect(cache.get()).toBe(7);

        cache.clear();
        expect(cache.get()).toBeUndefined();
    });

    test("two slots with one name share a value, as two bundles would", () => {
        const page_bundle = globalCache<string>({
            name: "cobble.grabAppSettings.cache",
        });
        const api_bundle = globalCache<string>({
            name: "cobble.grabAppSettings.cache",
        });

        page_bundle.clear();
        page_bundle.set("stale");

        // The API sees what the page wrote, so a save there clears it too.
        expect(api_bundle.get()).toBe("stale");

        api_bundle.clear();
        expect(page_bundle.get()).toBeUndefined();
    });

    test("different names never share a slot", () => {
        const envs = globalCache<string>({ name: "cobble.grabAllEnvs.cache" });
        const settings = globalCache<string>({
            name: "cobble.grabAppSettings.cache",
        });

        envs.clear();
        settings.clear();

        envs.set("a");
        settings.set("b");

        expect(envs.get()).toBe("a");
        expect(settings.get()).toBe("b");

        envs.clear();
        settings.clear();
    });
});
