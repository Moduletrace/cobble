import { beforeEach, describe, expect, test } from "bun:test";
import readDebugOpen from "./read-debug-open";
import rememberDebugOpen from "./remember-debug-open";

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

let storage: MemoryStorage;

beforeEach(() => {
    storage = new MemoryStorage();
    Object.defineProperty(globalThis, "localStorage", {
        value: storage as unknown as Storage,
        configurable: true,
    });
});

describe("the debug view's remembered state", () => {
    test("starts closed", () => {
        expect(readDebugOpen({ user_id: 1 })).toBe(false);
    });

    test("keeps its state per user, across conversations", () => {
        rememberDebugOpen({ user_id: 1, open: true });

        expect(readDebugOpen({ user_id: 1 })).toBe(true);
        expect(readDebugOpen({ user_id: 2 })).toBe(false);
    });

    test("remembers closing it again", () => {
        rememberDebugOpen({ user_id: 1, open: true });
        rememberDebugOpen({ user_id: 1, open: false });

        expect(readDebugOpen({ user_id: 1 })).toBe(false);
    });

    test("keeps the other users' answers when one changes", () => {
        rememberDebugOpen({ user_id: 1, open: true });
        rememberDebugOpen({ user_id: 2, open: true });

        expect(readDebugOpen({ user_id: 1 })).toBe(true);
        expect(readDebugOpen({ user_id: 2 })).toBe(true);
    });

    test("a broken stored value reads as closed, and is written over", () => {
        storage.setItem("cobble_debug_view_open", "not json");

        expect(readDebugOpen({ user_id: 1 })).toBe(false);

        rememberDebugOpen({ user_id: 1, open: true });

        expect(readDebugOpen({ user_id: 1 })).toBe(true);
    });

    test("keeps working without a user id", () => {
        rememberDebugOpen({ user_id: null, open: true });

        expect(readDebugOpen({ user_id: null })).toBe(true);
    });
});