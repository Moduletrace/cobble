import type {
    BUN_SQLITE_COBBLE_MEDIA,
    BUN_SQLITE_COBBLE_MEDIA_PARADIGMS,
    BUN_SQLITE_COBBLE_USERS,
    BunSQLiteTables,
} from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import type {
    MediaDataType,
    MediaParadigm,
    MediaType,
    TableType,
    User,
} from "@/src/types";
import grabDirNames from "@/src/utils/grab-dir-names";
import BunSQLite, { type APIResponseObject } from "@moduletrace/bun-sqlite";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import sharp from "sharp";
import fileToText from "./file-to-text";
import MediaDataToArrayBuffer from "./media-data-to-array-buffer";
import sniffMediaExtension from "./sniff-media-ext";
import mediaDataToSharpInput from "./meida-data-to-sharp-input";
import deleteMedia from "../../media/delete-media";

type Params = {
    media_paradigms?: MediaParadigm[];
    media_type?: MediaType;
    user: BUN_SQLITE_COBBLE_USERS | User;
    data?: MediaDataType;
    is_primary?: boolean;
    update_on_duplicate?: boolean;
    extract_media_text_content?: boolean;
    media?: BUN_SQLITE_COBBLE_MEDIA;
    media_name?: string;
    media_mime_type?: string;
    is_private?: boolean;
    image_width?: number;
    image_height?: number;
    thumbnail_width?: number;
    existing_media_id?: string | number;
    media_text_content?: string;
};

export default async function uploadAndRecordMedia({
    media_paradigms,
    user,
    data,
    media_type,
    is_primary,
    update_on_duplicate,
    extract_media_text_content,
    media,
    media_mime_type,
    media_name,
    is_private,
    image_width,
    image_height,
    thumbnail_width,
    existing_media_id,
    media_text_content: passed_media_text_content,
}: Params): Promise<APIResponseObject<BUN_SQLITE_COBBLE_MEDIA>> {
    const now = Date.now();
    let target_file_name = `${media_name || now}`;
    let target_file_thumbnail_name = `${media_name || now}-thumb`;

    const {
        USER_MEDIA_PRIVATE_RELATIVE_DIR,
        USER_MEDIA_PUBLIC_RELATIVE_DIR,
        DATA_DIR,
    } = grabDirNames({
        user,
    });

    const MEDIA_RELATIVE_DIR = is_private
        ? USER_MEDIA_PRIVATE_RELATIVE_DIR
        : USER_MEDIA_PUBLIC_RELATIVE_DIR;

    if (!MEDIA_RELATIVE_DIR) {
        throw new Error(`No target media directory found!`);
    }

    let media_written_to_disk = false;
    let media_text_content = passed_media_text_content;

    let media_ext = media_mime_type
        ? media_mime_type.replace(/\./g, "")
        : undefined;

    if (!media_ext && data) {
        if (typeof data === "string" && data.startsWith("data:")) {
            const base64_mime = data.match(/^data:([^;]+);base64,/)?.[1];

            if (base64_mime) {
                media_ext = base64_mime.split("/").pop() ?? undefined;
            }
        } else if (data instanceof File && data.name.includes(".")) {
            media_ext = data.name.split(".").pop();
        } else if (
            data instanceof Blob &&
            data.type &&
            !data.type.includes("octet-stream")
        ) {
            media_ext = data.type.split("/").pop();
        } else if (media_type === "image") {
            media_ext = "jpeg";
        } else if (typeof data !== "string") {
            media_ext = await sniffMediaExtension(data);
        }
    }

    const media_write_path = path.join(
        MEDIA_RELATIVE_DIR,
        `${target_file_name}.${media_ext}`,
    );
    const media_thumbnail_write_path = path.join(
        MEDIA_RELATIVE_DIR,
        `${target_file_thumbnail_name}.${media_ext}`,
    );

    const media_write_path_full = path.join(DATA_DIR, media_write_path);
    const media_thumbnail_write_path_full = path.join(
        DATA_DIR,
        media_thumbnail_write_path,
    );

    mkdirSync(path.dirname(media_write_path_full), { recursive: true });

    if (data && media_type == "image" && media_ext) {
        const buffer = await mediaDataToSharpInput(data);
        const is_profile_image =
            media_paradigms?.includes("user-profile-image");
        const thumb_width = thumbnail_width ?? AppData["ImageThumbnailSize"];

        let full_width: number | undefined;
        let full_height: number | undefined;
        let full_options: {
            fit?: "cover" | "inside";
            withoutEnlargement?: boolean;
        } = {};

        if (is_profile_image) {
            full_width = AppData["MainImageSize"];
            full_height = AppData["MainImageSize"];
            full_options = { fit: "cover" };
        } else {
            const meta = await sharp(buffer).metadata();
            const source_width = image_width ?? meta.width;
            const source_height = image_height ?? meta.height;
            const max = AppData["MaxImageWidth"];

            full_width =
                source_width != null
                    ? source_width > max
                        ? max
                        : source_width
                    : max;
            full_height =
                image_height != null
                    ? source_height != null && source_height > max
                        ? max
                        : source_height
                    : undefined;
            full_options = { fit: "inside", withoutEnlargement: true };
        }

        const [full, thumb] = await Promise.all([
            sharp(buffer)
                .resize(full_width, full_height, full_options)
                .jpeg({ quality: AppData["ImageQuality"] })
                .toBuffer(),
            sharp(buffer)
                .resize(
                    thumb_width,
                    is_profile_image ? thumb_width : undefined,
                    is_profile_image
                        ? { fit: "cover" }
                        : { fit: "inside", withoutEnlargement: true },
                )
                .jpeg({ quality: AppData["ImageThumbnailQuality"] })
                .toBuffer(),
        ]);

        await Bun.write(media_write_path_full, full);
        await Bun.write(media_thumbnail_write_path_full, thumb);
    } else if (data) {
        const media_array_buffer = await MediaDataToArrayBuffer(data);
        await Bun.write(media_write_path_full, media_array_buffer, {
            mode: 1,
        });

        if (extract_media_text_content) {
            const media_text = await fileToText({
                file_type: media_ext,
                file_stream: Buffer.from(media_array_buffer),
            });

            if (media_text) {
                media_text_content = media_text;
            }
        }
    }

    if (existsSync(media_write_path)) {
        media_written_to_disk = true;
    }

    if (is_primary) {
        const existing_user_primary_media = await BunSQLite.select<
            BUN_SQLITE_COBBLE_MEDIA,
            TableType
        >({
            table: "media",
            query: {
                query: {
                    user_id: { value: user.id },
                    is_primary: { value: 1 },
                },
            },
        });

        if (existing_user_primary_media.payload) {
            await deleteMedia({
                can_delete_all_media: true,
                ids: existing_user_primary_media.payload.map((m) => m.id!),
            });
        }
    }

    const media_data: BUN_SQLITE_COBBLE_MEDIA = {
        ...media,
        user_id: Number(user.id),
        is_primary: is_primary ? 1 : 0,
        media_write_path: media_write_path,
        media_thumbnail_write_path:
            media_type === "image" ? media_thumbnail_write_path : undefined,
        media_type: media_type as any,
        mime_type: media_type == "image" ? "jpeg" : media_ext,
        text_content: media_text_content,
    };

    let media_record: BUN_SQLITE_COBBLE_MEDIA | undefined = undefined;

    if (existing_media_id) {
        const update_media_record = await BunSQLite.update<
            BUN_SQLITE_COBBLE_MEDIA,
            TableType
        >({
            data: media_data,
            table: "media",
            targetId: existing_media_id,
        });

        media_record = update_media_record.singleRes || undefined;
    } else {
        const new_media_record = await BunSQLite.insert<
            BUN_SQLITE_COBBLE_MEDIA,
            TableType
        >({
            data: [media_data],
            table: "media",
            update_on_duplicate,
        });

        media_record = new_media_record.singleRes || undefined;
    }

    if (!media_record) {
        throw new Error(`Couldn't record media!`);
    }

    if (media_paradigms?.[0] && media_record?.id) {
        const delete_existing_paradigms = await BunSQLite.delete<
            BUN_SQLITE_COBBLE_MEDIA_PARADIGMS,
            (typeof BunSQLiteTables)[number]
        >({
            table: "media_paradigms",
            query: {
                query: { media_id: { value: media_record.id } },
            },
        });

        await BunSQLite.insert<
            BUN_SQLITE_COBBLE_MEDIA_PARADIGMS,
            (typeof BunSQLiteTables)[number]
        >({
            data: media_paradigms.map((mp) => ({
                media_id: media_record.id,
                media_paradigm: mp,
            })),
            table: "media_paradigms",
            update_on_duplicate,
        });
    }

    return {
        success: true,
        singleRes: media_record,
    };
}
