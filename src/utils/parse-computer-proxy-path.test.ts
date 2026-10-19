import { describe, expect, test } from "bun:test";
import parseComputerProxyPath from "./parse-computer-proxy-path";

describe("parseComputerProxyPath", () => {
    test("splits the computer id from the path on it", () => {
        expect(parseComputerProxyPath({ pathname: "/computers/3/v1/shell/ws" })).toEqual({
            computer_id: 3,
            prefix: "/computers/3",
            rest: "v1/shell/ws",
        });
    });

    test("takes the computer's root with or without a slash", () => {
        expect(parseComputerProxyPath({ pathname: "/computers/3" })?.rest).toBe("");
        expect(parseComputerProxyPath({ pathname: "/computers/3/" })?.rest).toBe("");
    });

    test("ignores anything else", () => {
        expect(parseComputerProxyPath({ pathname: "/computers" })).toBeNull();
        expect(parseComputerProxyPath({ pathname: "/computers/x/terminal" })).toBeNull();
        expect(parseComputerProxyPath({ pathname: "/computers/0/terminal" })).toBeNull();
        expect(parseComputerProxyPath({ pathname: "/computersx/3" })).toBeNull();
    });
});
