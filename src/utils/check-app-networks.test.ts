import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import checkAppNetworks from "./check-app-networks";
import parseAppNetworks from "./parse-app-networks";

describe("checkAppNetworks", () => {
    test("trims, drops blanks and repeats, keeps the order", () => {
        expect(checkAppNetworks({ networks: [" tunnel ", "", "db_net", "tunnel"] })).toEqual({
            networks: ["tunnel", "db_net"],
        });
    });

    test("refuses names docker wouldn't take", () => {
        expect(checkAppNetworks({ networks: ["bad name"] }).error).toBeString();
        expect(checkAppNetworks({ networks: ["-dash"] }).error).toBeString();
        expect(checkAppNetworks({ networks: ["a;rm"] }).error).toBeString();
    });

    test("refuses host, none and the computers' network", () => {
        expect(checkAppNetworks({ networks: ["host"] }).error).toBeString();
        expect(checkAppNetworks({ networks: ["none"] }).error).toBeString();
        expect(checkAppNetworks({ networks: [AppData.DockerNetworkName] }).error).toBeString();
    });

    test("caps how many", () => {
        const many = Array.from({ length: AppData.AppExtraNetworksMax + 1 }, (_, i) => `net${i}`);

        expect(checkAppNetworks({ networks: many }).error).toBeString();
        expect(checkAppNetworks({ networks: many.slice(1) }).networks).toHaveLength(AppData.AppExtraNetworksMax);
    });
});

describe("parseAppNetworks", () => {
    test("reads a saved list", () => {
        expect(parseAppNetworks({ value: JSON.stringify(["tunnel", "db"]) })).toEqual(["tunnel", "db"]);
    });

    test("is empty for nothing, junk or an invalid list", () => {
        expect(parseAppNetworks({ value: null })).toEqual([]);
        expect(parseAppNetworks({ value: "not json" })).toEqual([]);
        expect(parseAppNetworks({ value: JSON.stringify({ a: 1 }) })).toEqual([]);
        expect(parseAppNetworks({ value: JSON.stringify(["host"]) })).toEqual([]);
    });
});
