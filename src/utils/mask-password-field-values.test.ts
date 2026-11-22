import { describe, expect, test } from "bun:test";
import maskPasswordFieldValues from "./mask-password-field-values";

describe("maskPasswordFieldValues", () => {
    test("masks a filled password field and the cell around it", () => {
        const text = [
            "- form:",
            '  - cell "🔒 lexbenoti10B" [ref=f2e14]:',
            '    - generic [ref=f2e15]: 🔒',
            '    - textbox "Password" [ref=f2e17]: lexbenoti10B',
            '  - cell " ben@tben.me" [ref=f2e9]:',
            '    - textbox "Username" [ref=f2e12]: ben@tben.me',
        ].join("\n");

        const masked = maskPasswordFieldValues({ text });

        expect(masked).not.toContain("lexbenoti10B");
        expect(masked).toContain('- cell "🔒 [hidden]" [ref=f2e14]:');
        expect(masked).toContain('- textbox "Password" [ref=f2e17]: [hidden]');
        expect(masked).toContain("ben@tben.me");
    });

    test("leaves a field that isn't a password alone", () => {
        const text = '- textbox "Search": quarterly report';

        expect(maskPasswordFieldValues({ text })).toBe(text);
    });

    test("masks a textarea's value on the line under it", () => {
        const text = ['- textbox "Passphrase":', "  - /placeholder: Your passphrase", "  - text: correct horse battery"].join(
            "\n",
        );

        const masked = maskPasswordFieldValues({ text });

        expect(masked).toContain("- text: [hidden]");
        expect(masked).not.toContain("correct horse battery");
    });

    test("masks a short code in the field and in the cell around it", () => {
        const text = ['- cell "1234" [ref=a]:', '  - textbox "One-time code" [ref=b]: 1234'].join("\n");

        const masked = maskPasswordFieldValues({ text });

        expect(masked).toContain('- textbox "One-time code" [ref=b]: [hidden]');
        expect(masked).toContain('- cell "[hidden]" [ref=a]:');
    });

    test("leaves what is already hidden", () => {
        const text = ['- cell "🔒 [hidden]" [ref=a]:', '  - textbox "Password" [ref=b]: [hidden]'].join("\n");

        expect(maskPasswordFieldValues({ text })).toBe(text);
    });

    test("keeps the rest of the snapshot as it was", () => {
        const text = [
            "- heading \"Sign in\" [level=1]",
            "- paragraph: Use your mailbox password to sign in.",
            "- button \"Sign in\"",
        ].join("\n");

        expect(maskPasswordFieldValues({ text })).toBe(text);
    });

    test("masks an empty field to nothing new", () => {
        const text = '- textbox "Password" [ref=a]';

        expect(maskPasswordFieldValues({ text })).toBe(text);
    });
});