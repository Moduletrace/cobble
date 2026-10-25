type Params = {
    expires_at: number;
    now?: number;
};

/**
 * How long a pending proposal can still be confirmed, e.g. `Expires in 23h`.
 */
export default function proposalExpiryLabel({ expires_at, now = Date.now() }: Params) {
    const minutes = Math.max(0, Math.round((expires_at - now) / 60000));

    if (minutes < 60) return `Expires in ${Math.max(1, minutes)}m`;

    return `Expires in ${Math.round(minutes / 60)}h`;
}
