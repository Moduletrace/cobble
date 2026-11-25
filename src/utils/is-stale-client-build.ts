type Params = {
    /**
     * The build the page that sent the request was running (`build_id`,
     * from its `cobble-build` meta tag).
     */
    client_build?: string | null;
    /**
     * The build the server runs now. Null in development, where nothing is
     * precached and every load is the current code.
     */
    server_build?: string | null;
};

/**
 * Whether a request comes from a page older than the running build. Build
 * ids are opaque, so any difference means the page runs code the server no
 * longer serves, and it has to reload into the new build. A request that
 * carries no build id (development, an old client) is never refused.
 */
export default function isStaleClientBuild({ client_build, server_build }: Params): boolean {
    if (!client_build || !server_build) return false;

    return client_build != server_build;
}