import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabDatabaseTables from "@/src/functions/backend/database/grab-database-tables";
import grabTableRecords from "@/src/functions/backend/database/grab-table-records";
import { SettingsDefaultPath } from "@/src/dict/settings-pages-dict";
import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabSettingsServerProps from "../../(functions)/grab-settings-server-props";

type Params = Parameters<BunextPageServerFn<PagePropsType>>[0];

/**
 * The database browser's page data: every table with its size and record
 * count, and the first page of the table asked for. Super admins only;
 * everyone else lands on the general settings.
 */
export default async function grabDatabaseServerProps(params: Params) {
    const settings = await grabSettingsServerProps(params);

    if (!settings.props) return settings;

    if (!(await grabSuperAdminUser({ req: params.req }))) {
        return {
            redirect: {
                destination: SettingsDefaultPath,
                permanent: false,
            },
        };
    }

    const tables = await grabDatabaseTables().catch(() => []);

    if (!tables.length) {
        return {
            props: {
                ...settings.props,
                database_tables: [],
                database_records: null,
            },
        };
    }

    const asked = params.query?.table;
    const first = tables[0];
    const table = typeof asked == "string" && asked ? asked : first?.name;
    const records = await grabTableRecords({ table }).catch(() => null);

    return {
        props: {
            ...settings.props,
            database_tables: tables,
            database_records: records,
        },
    };
}
