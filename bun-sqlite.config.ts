import type { BunSQLiteConfig } from "@moduletrace/bun-sqlite/types";

const config: BunSQLiteConfig = {
    db_name: "cobble",
    db_dir: "./db",
    typedef_file_path: "./db/types/db.ts",
    db_schema_file_name: "schema.ts",
};

export default config;
