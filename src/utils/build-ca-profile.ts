type Params = {
    /**
     * The CA certificate in PEM, as `ca.crt` holds it.
     */
    certificate_pem: string;
    /**
     * The name iOS and macOS show for the profile.
     */
    display_name: string;
    /**
     * Reverse-DNS identifier of the profile, e.g. `org.example.cobble.ca`.
     */
    identifier: string;
};

/**
 * Fixed UUIDs, so installing the profile again replaces it on the device
 * instead of leaving an older Cobble CA behind.
 */
const ProfileUUID = "B7F3C2A1-6D4E-4F8A-9C1B-2E5A7D9F0B31";
const CertificateUUID = "D2A8E4C6-1B3F-4A7D-8E5C-9F0B6A2C4D18";

const XmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
};

function escapeXml({ value }: { value: string }): string {
    return value.replace(/[&<>"']/g, (character) => XmlEscapes[character]!);
}

/**
 * The certificate as base64 DER, which is what a plist `<data>` holds:
 * the PEM body itself, with its markers and line breaks removed.
 */
function certificateData({ certificate_pem }: { certificate_pem: string }) {
    const data = certificate_pem
        .replace(/-----BEGIN CERTIFICATE-----/g, "")
        .replace(/-----END CERTIFICATE-----/g, "")
        .replace(/\s+/g, "");

    if (!data) {
        throw new Error("The CA certificate is empty.");
    }

    return data;
}

/**
 * An iOS/macOS configuration profile carrying the local CA
 * (`com.apple.security.root`). Opening it on an iPhone offers a one-tap
 * install instead of a file to find and install by hand; iOS still asks
 * for the separate trust switch afterwards, which no profile can skip on
 * an unmanaged device.
 */
export default function buildCaProfile({
    certificate_pem,
    display_name,
    identifier,
}: Params): string {
    const name = escapeXml({ value: display_name });
    const id = escapeXml({ value: identifier });

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>PayloadCertificateFileName</key>
            <string>${name}.crt</string>
            <key>PayloadContent</key>
            <data>
                ${certificateData({ certificate_pem })}
            </data>
            <key>PayloadDescription</key>
            <string>Lets this device trust the HTTPS certificate ${name} serves.</string>
            <key>PayloadDisplayName</key>
            <string>${name}</string>
            <key>PayloadIdentifier</key>
            <string>${id}.certificate</string>
            <key>PayloadType</key>
            <string>com.apple.security.root</string>
            <key>PayloadUUID</key>
            <string>${CertificateUUID}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
        </dict>
    </array>
    <key>PayloadDescription</key>
    <string>Installs the local certificate authority that signs ${name}, then turn on trust under Certificate Trust Settings.</string>
    <key>PayloadDisplayName</key>
    <string>${name}</string>
    <key>PayloadIdentifier</key>
    <string>${id}</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>${ProfileUUID}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>
`;
}
