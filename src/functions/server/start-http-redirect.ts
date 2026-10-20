import buildHttpsRedirectUrl from "@/src/utils/build-https-redirect-url";

type Params = {
    /**
     * The port the app serves HTTPS on.
     */
    https_port: string | number;
};

/**
 * A plain-HTTP listener on the port above the HTTPS one, which sends the
 * browser to the same page over HTTPS.
 *
 * A port that speaks TLS cannot answer plain HTTP, so this cannot sit on
 * the HTTPS port itself: `http://<host>:<port>` still fails, but
 * `http://<host>:<port + 1>` lands on the right page. `HTTP_REDIRECT_PORT`
 * picks another port. Every environment starts it; the container publishes
 * only the HTTPS port, so there it is reachable only if that second port is
 * published too.
 */
export default function startHttpRedirect({ https_port }: Params) {
    const base = Number(https_port);
    const configured = Number(process.env.HTTP_REDIRECT_PORT);
    const redirect_port =
        Number.isInteger(configured) && configured > 0
            ? configured
            : Number.isInteger(base) && base > 0
              ? base + 1
              : 7228;

    if (redirect_port == base) return undefined;

    return Bun.serve({
        port: redirect_port,
        reusePort: false,
        fetch(req) {
            return Response.redirect(
                buildHttpsRedirectUrl({
                    request_url: new URL(req.url),
                    https_port,
                }),
                308,
            );
        },
    });
}
