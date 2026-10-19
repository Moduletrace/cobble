import relativeTime from "@/src/utils/relative-time";

type Params = {
    at: number;
};

/**
 * When a status was last checked, for a sentence: "just now", "5m ago",
 * "on Tue".
 */
export default function checkedAgo({ at }: Params) {
    const time = relativeTime({ at });

    if (time == "now") return "just now";

    return /^\d/.test(time) ? `${time} ago` : `on ${time}`;
}
