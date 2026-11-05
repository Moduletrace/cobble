/**
 * Whether `zone` is an IANA timezone this runtime knows (`Africa/Lagos`).
 */
export default function isTimeZone({ zone }: { zone: string }) {
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: zone });
        return /^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$/.test(zone);
    } catch {
        return false;
    }
}
