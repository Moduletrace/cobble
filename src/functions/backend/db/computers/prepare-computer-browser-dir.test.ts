import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { AppData } from "@/src/data/app-data";
import prepareComputerBrowserDir from "./prepare-computer-browser-dir";

let data_dir = "";
const previous_data_dir = process.env.DATA_DIR;

beforeAll(async () => {
    data_dir = await fs.mkdtemp(path.join(os.tmpdir(), "browser-dir-"));
    process.env.DATA_DIR = data_dir;
});

afterAll(async () => {
    process.env.DATA_DIR = previous_data_dir;
    if (previous_data_dir === undefined) delete process.env.DATA_DIR;
    await fs.rm(data_dir, { recursive: true, force: true });
});

const readPreferences = async ({ dir }: { dir: string }) =>
    JSON.parse(await fs.readFile(path.join(dir, "Default", "Preferences"), "utf8"));

describe("prepareComputerBrowserDir", () => {
    test("seeds preferences that keep cookies", async () => {
        const dir = await prepareComputerBrowserDir({ computer_id: 1 });

        expect(dir).toBe(path.join(data_dir, AppData.ComputerBrowserDataDir, "1"));

        const preferences = await readPreferences({ dir });

        expect(preferences.profile.default_content_setting_values.cookies).toBeUndefined();
        expect(preferences.password_manager_enabled).toBe(false);
    });

    test("keeps what Chrome saved and drops the old process's links", async () => {
        const dir = await prepareComputerBrowserDir({ computer_id: 2 });
        const saved = { profile: { content_settings: { exceptions: { notifications: { a: 1 } } } } };

        await fs.writeFile(path.join(dir, "Default", "Preferences"), JSON.stringify(saved));
        await fs.writeFile(path.join(dir, "Default", "Cookies"), "cookies");
        await fs.symlink("cobble-computer-2-4409", path.join(dir, "SingletonLock"));
        await fs.symlink("/tmp/gone/SingletonSocket", path.join(dir, "SingletonSocket"));

        await prepareComputerBrowserDir({ computer_id: 2 });

        expect(await readPreferences({ dir })).toEqual(saved);
        expect(await fs.readFile(path.join(dir, "Default", "Cookies"), "utf8")).toBe("cookies");
        expect(await fs.lstat(path.join(dir, "SingletonLock")).catch(() => null)).toBeNull();
        expect(await fs.lstat(path.join(dir, "SingletonSocket")).catch(() => null)).toBeNull();
    });

    test("moves an old profile aside for a fresh computer", async () => {
        const dir = await prepareComputerBrowserDir({ computer_id: 3 });

        await fs.writeFile(path.join(dir, "Default", "Cookies"), "old");
        await prepareComputerBrowserDir({ computer_id: 3, fresh: true });

        expect(await fs.stat(path.join(dir, "Default", "Cookies")).catch(() => null)).toBeNull();

        const kept = (await fs.readdir(path.dirname(dir))).filter((name) => name.startsWith("3-"));

        expect(kept.length).toBe(1);
        expect(await fs.readFile(path.join(path.dirname(dir), kept[0]!, "Default", "Cookies"), "utf8")).toBe("old");
    });
});
