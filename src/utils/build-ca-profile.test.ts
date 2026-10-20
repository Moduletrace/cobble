import { describe, expect, test } from "bun:test";
import buildCaProfile from "./build-ca-profile";

const pem = `-----BEGIN CERTIFICATE-----
MIIBhTCCASugAwIBAgIUTEST
-----END CERTIFICATE-----
`;

const profile = (display_name = "Cobble local CA") =>
    buildCaProfile({
        certificate_pem: pem,
        display_name,
        identifier: "org.example.cobble.ca",
    });

describe("buildCaProfile", () => {
    test("is a root certificate profile", () => {
        expect(profile()).toContain("<string>com.apple.security.root</string>");
        expect(profile()).toContain("<string>Configuration</string>");
    });

    test("embeds the PEM body as DER base64", () => {
        const body = profile();

        expect(body).toContain("MIIBhTCCASugAwIBAgIUTEST");
        expect(body).not.toContain("BEGIN CERTIFICATE");
        expect(body).not.toContain("END CERTIFICATE");
    });

    test("names the profile with its identifier", () => {
        const body = profile();

        expect(body).toContain("<string>Cobble local CA</string>");
        expect(body).toContain("<string>org.example.cobble.ca</string>");
        expect(body).toContain(
            "<string>org.example.cobble.ca.certificate</string>",
        );
    });

    test("escapes XML in the name", () => {
        expect(profile("Ben & Co <CA>")).toContain("Ben &amp; Co &lt;CA&gt;");
    });

    test("refuses an empty certificate", () => {
        expect(() =>
            buildCaProfile({
                certificate_pem: "  ",
                display_name: "Cobble",
                identifier: "org.example.cobble.ca",
            }),
        ).toThrow("The CA certificate is empty.");
    });
});
