import { beforeEach, describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import readPlanMode from "./read-plan-mode";
import rememberPlanMode from "./remember-plan-mode";

/**
 * The functions only ever touch `localStorage` when they're called, so a
 * small in-memory stand-in is enough here (the same one the debug view's
 * test uses, since Bun's own `localStorage` can't be assigned to).
 */
class MemoryStorage {
    private store = new Map<string, string>();

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

let storage: MemoryStorage;

beforeEach(() => {
    storage = new MemoryStorage();
    Object.defineProperty(globalThis, "localStorage", {
        value: storage as unknown as Storage,
        configurable: true,
    });
});

describe("Plan mode remembered per conversation", () => {
    test("a conversation starts with Plan mode off", () => {
        expect(readPlanMode({ bot_id: 4 })).toBe(false);
    });

    test("turning it on stays with that bot and workspace only", () => {
        rememberPlanMode({ bot_id: 4, workspace_id: 9, on: true });

        expect(readPlanMode({ bot_id: 4, workspace_id: 9 })).toBe(true);
        expect(readPlanMode({ bot_id: 4 })).toBe(false);
        expect(readPlanMode({ bot_id: 5, workspace_id: 9 })).toBe(false);
    });

    test("turning it off forgets it", () => {
        rememberPlanMode({ bot_id: 4, on: true });
        rememberPlanMode({ bot_id: 4, on: false });

        expect(readPlanMode({ bot_id: 4 })).toBe(false);
    });

    test("a stored value of another shape reads as off", () => {
        storage.setItem(AppData["PlanModeStorageKey"], "[1,2,3]");

        expect(readPlanMode({ bot_id: 4 })).toBe(false);
    });
});