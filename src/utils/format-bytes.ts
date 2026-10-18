const Units = ["B", "KB", "MB", "GB", "TB"];

type Params = {
    bytes: number;
};

/**
 * Human readable file size, e.g. `12.2 KB`.
 */
export default function formatBytes({ bytes }: Params) {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return "0 B";
    }

    const unit_index = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        Units.length - 1,
    );

    const value = bytes / 1024 ** unit_index;

    return `${unit_index == 0 ? value : value.toFixed(1)} ${Units[unit_index]}`;
}
