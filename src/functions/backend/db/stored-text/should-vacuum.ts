import { AppData } from "@/src/data/app-data";

type Params = {
    page_count: number;
    freelist_count: number;
    page_size: number;
};

/**
 * Whether enough of the database file sits free to be worth a `VACUUM`
 * (`AppData.DbVacuumMinFreeRatio` of its pages and at least
 * `AppData.DbVacuumMinFreeBytes`). Deleted rows only free pages inside the
 * file; it shrinks on disk only when vacuumed.
 */
export default function shouldVacuum({ page_count, freelist_count, page_size }: Params) {
    if (!(page_count > 0) || !(freelist_count > 0)) return false;

    return (
        freelist_count / page_count >= AppData.DbVacuumMinFreeRatio &&
        freelist_count * page_size >= AppData.DbVacuumMinFreeBytes
    );
}
