import { describe, expect, test } from "bun:test";
import resolveComputerHomeDir from "./resolve-computer-home-dir";

const data_dir = "/data";

describe("resolveComputerHomeDir", () => {
    test("uses the directory the app bind-mounted", () => {
        /**
         * The truth for a container the app provisioned: on a bind mount
         * that can be anywhere on the docker host, not under DATA_DIR.
         */
        expect(
            resolveComputerHomeDir({
                computer_id: 2,
                kind: "sandbox",
                metadata: JSON.stringify({ data_dir: "/srv/homes/2", host_dir: "/host/2" }),
                main_data_dir: "/wrong",
                data_dir,
            }),
        ).toBe("/srv/homes/2");
    });

    test("falls back to MAIN_COMPUTER_DATA_DIR for the main computer", () => {
        expect(
            resolveComputerHomeDir({
                computer_id: 1,
                kind: "main",
                metadata: null,
                main_data_dir: "/media/docker/aio-sandbox/data/home",
                data_dir,
            }),
        ).toBe("/media/docker/aio-sandbox/data/home");
    });

    test("leaves a sandbox alone whatever the main setting says", () => {
        expect(
            resolveComputerHomeDir({
                computer_id: 3,
                kind: "sandbox",
                metadata: null,
                main_data_dir: "/media/docker/aio-sandbox/data/home",
                data_dir,
            }),
        ).toBe("/data/computers/3");
    });

    test("uses the conventional folder when nothing is recorded", () => {
        expect(resolveComputerHomeDir({ computer_id: 4, kind: "main", data_dir })).toBe(
            "/data/computers/4",
        );
    });

    test("ignores an empty or unreadable record", () => {
        expect(
            resolveComputerHomeDir({ computer_id: 5, metadata: JSON.stringify({ data_dir: "   " }), data_dir }),
        ).toBe("/data/computers/5");
        expect(resolveComputerHomeDir({ computer_id: 5, metadata: "not json", data_dir })).toBe(
            "/data/computers/5",
        );
        expect(resolveComputerHomeDir({ computer_id: 5, metadata: null, data_dir })).toBe(
            "/data/computers/5",
        );
    });

    test("normalizes a recorded relative path", () => {
        expect(
            resolveComputerHomeDir({ computer_id: 6, metadata: JSON.stringify({ data_dir: "/srv/a/../b" }), data_dir }),
        ).toBe("/srv/b");
    });
});
