import type { BUN_SQLITE_BSQLITE_LOGS_JOIN } from "@/src/types/sql-joins";

type Params = {
    log: BUN_SQLITE_BSQLITE_LOGS_JOIN;
};

export default function getLogUserName({ log }: Params) {
    const name = [log.user_first_name, log.user_last_name]
        .filter(Boolean)
        .join(" ");

    return name || undefined;
}
