import { AppData } from "@/src/data/app-data";
import { SiteData } from "@/src/data/site-data";
import buildCaProfile from "@/src/utils/build-ca-profile";

type Params = {
    pathname: string;
};

/**
 * Serves the local CA that signed the app's certificate
 * (`TLS_CA_FILE`), so a device can trust it without copying files across
 * the network: the certificate itself, and an iOS/macOS profile that
 * installs it in one tap.
 *
 * A certificate is public information; the key never leaves
 * `$COBBLE_HOME/certs`. Returns `null` for every other path, and for an
 * install using its own certificate, which has no local CA.
 */
export default async function serveLocalCa({
    pathname,
}: Params): Promise<Response | null> {
    const certificate_path = pathname == AppData["TlsCaPath"];
    const profile_path = pathname == AppData["TlsCaProfilePath"];

    if (!certificate_path && !profile_path) return null;

    const ca_file = process.env.TLS_CA_FILE?.trim();

    if (!ca_file) return null;

    const file = Bun.file(ca_file);

    if (!(await file.exists())) return new Response("Not Found", { status: 404 });

    if (certificate_path) {
        return new Response(file, {
            headers: new Headers({
                "Content-Type": "application/x-x509-ca-cert",
                "Content-Disposition": `attachment; filename="${AppData["TlsCaFilename"]}"`,
                "Cache-Control": "no-store, max-age=0, must-revalidate",
                "X-Content-Type-Options": "nosniff",
            }),
        });
    }

    const profile = buildCaProfile({
        certificate_pem: await file.text(),
        display_name: `${SiteData["SiteName"]} local CA`,
        identifier: `org.${SiteData["SiteSlug"]}.ca`,
    });

    return new Response(profile, {
        headers: new Headers({
            "Content-Type": "application/x-apple-aspen-config",
            "Content-Disposition": `attachment; filename="${AppData["TlsCaProfileFilename"]}"`,
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            "X-Content-Type-Options": "nosniff",
        }),
    });
}
