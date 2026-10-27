import { describe, expect, test } from "bun:test";
import graphicRef, { graphicRefId } from "./graphic-ref";
import linkComputerRefs from "./link-computer-refs";

describe("graphicRef", () => {
    test("names a graphic", () => {
        expect(graphicRef({ id: 5 })).toBe("[graphic:5]");
    });

    test("reads the id back from its link", () => {
        expect(graphicRefId({ href: "#graphic-5" })).toBe(5);
        expect(graphicRefId({ href: "#graphic-0" })).toBeNull();
        expect(graphicRefId({ href: "#graphic-x" })).toBeNull();
        expect(graphicRefId({ href: "#file-5" })).toBeNull();
        expect(graphicRefId({ href: null })).toBeNull();
    });

    test("becomes a link in a message", () => {
        expect(linkComputerRefs({ text: "Here: [graphic:5]" })).toBe("Here: [graphic 5](#graphic-5)");
    });
});
