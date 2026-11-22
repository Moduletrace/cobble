import type { ConnectorApp } from "@/src/harness/connectors/connector-provider";
import type { ConnectorProviderId } from "@/src/dict/connector-dict";
import connectorSlug from "@/src/utils/connector-slug";

type Connection = {
    id: number;
    provider: ConnectorProviderId;
    name: string;
};

type ExistingRow = {
    app: string;
    name: string;
    description: string;
    logo: string;
};

type Params = {
    connection: Connection;
    apps: ConnectorApp[];
    existing: ExistingRow[];
    /**
     * Every slug the install already uses, so a new app never takes one.
     */
    taken: string[];
};

/**
 * One row to insert for an app the connection offers that isn't stored yet.
 */
export type PlannedConnector = {
    provider: ConnectorProviderId;
    connection_id: number;
    app: string;
    name: string;
    slug: string;
    description: string;
    logo: string;
    scopes: string[];
    user_id: number;
};

export type ConnectorSyncPlan = {
    /**
     * Apps this connection doesn't have yet, each with the slug its tools
     * use.
     */
    inserts: PlannedConnector[];
    /**
     * Stored apps whose name, description or logo the provider changed.
     * Their slug, reach, accounts and tools stay as they are.
     */
    updates: ExistingRow[];
};

/**
 * What a provider sync changes: the apps to store for the first time, and
 * the stored ones whose wording moved. Pure, so the merge is tested without
 * a database.
 *
 * The same app through two connections is two rows: the second never takes
 * the slug the first one's tools already use, so it gets its connection in
 * the name (`gmail-work`) and only then a number.
 */
export default function planConnectorSync({ connection, apps, existing, taken }: Params): ConnectorSyncPlan {
    const stored = new Map(existing.map((row) => [row.app, row]));
    const used = new Set(taken);
    const inserts: PlannedConnector[] = [];
    const updates: ExistingRow[] = [];
    const connection_slug = connectorSlug({ name: connection.name });

    for (const app of apps) {
        const row = stored.get(app.app);

        if (!row) {
            const name = app.name || app.app;
            const base = connectorSlug({ name });

            inserts.push({
                provider: connection.provider,
                connection_id: connection.id,
                app: app.app,
                name,
                slug: freeSlug({ base, connection_slug, used }),
                description: app.description,
                logo: app.logo,
                scopes: app.scopes || [],
                user_id: 0,
            });
            continue;
        }

        if (row.name != app.name || row.description != app.description || row.logo != app.logo) {
            updates.push({ app: app.app, name: app.name, description: app.description, logo: app.logo });
        }
    }

    return { inserts, updates };
}

type SlugParams = {
    base: string;
    connection_slug: string;
    used: Set<string>;
};

/**
 * A slug for one of the connection's apps. When another connector already
 * took the app's own name, the connection names it (`gmail-work`), and a
 * number after that only when even that is used.
 */
function freeSlug({ base, connection_slug, used }: SlugParams) {
    const candidates = [base, `${base}-${connection_slug}`];
    const first_free = candidates.find((candidate) => !used.has(candidate));

    if (first_free) {
        used.add(first_free);
        return first_free;
    }

    const stem = base.slice(0, 12);

    for (let index = 2; index < 1000; index++) {
        const candidate = `${stem}-${index}`;

        if (!used.has(candidate)) {
            used.add(candidate);
            return candidate;
        }
    }

    throw new Error(`Too many connectors share the name ${base}.`);
}