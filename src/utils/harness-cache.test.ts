import { beforeEach, describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import type {
    BotHarnessSettingsPayload,
    HarnessCatalogPayload,
} from "@/src/types";
import {
    clearHarnessCache,
    readHarnessCatalogCache,
    readHarnessSettingsCache,
    writeHarnessCatalogCache,
    writeHarnessSettingsCache,
} from "./harness-cache";

class MemoryStorage {
    private store = new Map<string, string>();

    get length() {
        return this.store.size;
    }

    key(index: number) {
        return [...this.store.keys()][index] ?? null;
    }

    getItem(key: string) {
        return this.store.get(key) ?? null;
    }

    setItem(key: string, value: string) {
        this.store.set(key, value);
    }

    removeItem(key: string) {
        this.store.delete(key);
    }

    clear() {
        this.store.clear();
    }
}

const catalog: HarnessCatalogPayload = {
    harnesses: [
        {
            harness: "text",
            title: "Text",
            description: "Chats.",
            required: true,
            automatic: true,
            providers: [{ id: 1, name: "OpenRouter" }],
            models: [],
        },
    ],
};

const settings: BotHarnessSettingsPayload = {
    harnesses: [
        {
            harness: "text",
            fallback: false,
            enabled: true,
            options: {},
            candidate_count: 2,
        },
    ],
};

let storage: MemoryStorage;

beforeEach(() => {
    storage = new MemoryStorage();
    Object.defineProperty(globalThis, "localStorage", {
        value: storage as unknown as Storage,
        configurable: true,
    });
});

describe("harness cache", () => {
    test("round-trips the catalog per user", () => {
        writeHarnessCatalogCache({ user_id: 1, data: catalog });

        expect(readHarnessCatalogCache({ user_id: 1 })?.data).toEqual(catalog);
        expect(readHarnessCatalogCache({ user_id: 2 })).toBeNull();
    });

    test("round-trips a conversation's settings per user, bot and workspace", () => {
        writeHarnessSettingsCache({
            user_id: 1,
            bot_id: 7,
            workspace_id: 3,
            data: settings,
        });

        expect(readHarnessSettingsCache({ user_id: 1, bot_id: 7, workspace_id: 3 })?.data).toEqual(
            settings,
        );
        expect(readHarnessSettingsCache({ user_id: 2, bot_id: 7, workspace_id: 3 })).toBeNull();
        expect(readHarnessSettingsCache({ user_id: 1, bot_id: 8, workspace_id: 3 })).toBeNull();
    });

    test("ignores another schema version", () => {
        storage.setItem(
            `${AppData.HarnessCacheStorageKey}:catalog:1`,
            JSON.stringify({ v: 0, at: Date.now(), data: catalog }),
        );

        expect(readHarnessCatalogCache({ user_id: 1 })).toBeNull();
    });

    test("clears the new and the older per-conversation keys only", () => {
        writeHarnessCatalogCache({ user_id: 1, data: catalog });
        writeHarnessSettingsCache({ user_id: 1, bot_id: 7, data: settings });
        storage.setItem(`${AppData.LegacyHarnessOverviewStorageKey}:7:0`, "{}");
        storage.setItem(`${AppData.ComposerDraftStorageKey}:7`, "draft");

        clearHarnessCache();

        expect(readHarnessCatalogCache({ user_id: 1 })).toBeNull();
        expect(readHarnessSettingsCache({ user_id: 1, bot_id: 7 })).toBeNull();
        expect(storage.getItem(`${AppData.LegacyHarnessOverviewStorageKey}:7:0`)).toBeNull();
        expect(storage.getItem(`${AppData.ComposerDraftStorageKey}:7`)).toBe("draft");
    });
});
