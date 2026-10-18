import path from "path";
import type { User } from "../types";
import type { BUN_SQLITE_BSQLITE_USERS } from "@/db/types/db";

type Params = {
    user?: BUN_SQLITE_BSQLITE_USERS | User;
};

export default function grabDirNames(params?: Params) {
    const DIRNAME = __dirname;
    const ROOT_DIR = DIRNAME.includes(`/.bunext`)
        ? process.cwd()
        : path.resolve(__dirname, "../..");

    const DATA_DIR = process.env.DATA_DIR || path.join(ROOT_DIR, ".data");
    const MEDIA_RELATIVE_DIR = "media";
    const MEDIA_DIR = path.join(DATA_DIR, MEDIA_RELATIVE_DIR);

    const USER_MEDIA_PUBLIC_DIR = params?.user?.id
        ? path.join(MEDIA_DIR, String(params.user.id), "public")
        : undefined;
    const USER_MEDIA_PUBLIC_RELATIVE_DIR = params?.user?.id
        ? path.join(MEDIA_RELATIVE_DIR, String(params.user.id), "public")
        : undefined;
    const USER_MEDIA_PRIVATE_DIR = params?.user?.id
        ? path.join(MEDIA_DIR, String(params.user.id), "private")
        : undefined;
    const USER_MEDIA_PRIVATE_RELATIVE_DIR = params?.user?.id
        ? path.join(MEDIA_RELATIVE_DIR, String(params.user.id), "private")
        : undefined;

    return {
        ROOT_DIR,
        MEDIA_DIR,
        USER_MEDIA_PUBLIC_DIR,
        USER_MEDIA_PRIVATE_DIR,
        DATA_DIR,
        USER_MEDIA_PUBLIC_RELATIVE_DIR,
        USER_MEDIA_PRIVATE_RELATIVE_DIR,
    };
}
