import dockerRequest from "./docker-request";

type Params = {
    container_id: string;
};

/**
 * The networks the app's container is on right now. `grabAppContainer`
 * reads them once per process, and they change under it (a network
 * removed and made again drops its members).
 */
export default async function inspectAppContainerNetworks({ container_id }: Params) {
    const res = await dockerRequest<{ NetworkSettings?: { Networks?: Record<string, unknown> } }>({
        path: `/containers/${encodeURIComponent(container_id)}/json`,
    });

    if (!res.ok) throw new Error(`Couldn't read the app's container: ${res.message}`);

    return Object.keys(res.data?.NetworkSettings?.Networks || {});
}
