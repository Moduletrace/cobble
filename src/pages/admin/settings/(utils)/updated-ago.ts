import checkedAgo from "./checked-ago";

type Params = {
    at: number | null;
};

/**
 * When an extension's settings last changed, for a row's subtitle:
 * "Updated 5m ago". Nothing when it's never been stamped.
 */
export default function updatedAgo({ at }: Params) {
    return at ? `Updated ${checkedAgo({ at })}` : undefined;
}
