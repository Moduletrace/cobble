import path from "path";
import type { BunSQLiteConfig } from "@moduletrace/bun-sqlite/types";

/**
 * The database lives in `DB_DIR` when it's set (the app's container puts
 * it on the data volume, so it survives updates), else in `./db`. The
 * schema always comes from the code, `db/schema.ts`.
 */
const db_dir = process.env.DB_DIR || "./db";

const config: BunSQLiteConfig = {
    db_name: "cobble",
    db_dir,
    typedef_file_path: "./db/types/db.ts",
    db_schema_file_name: path.relative(path.resolve(db_dir), path.resolve("db/schema.ts")),
};

export default config;
