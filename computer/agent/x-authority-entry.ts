/**
 * Xauth's "any address" family: the cookie holds for the display whatever
 * the client calls the host.
 */
const FamilyWild = 0xffff;

/**
 * One Xauthority entry (the format `xauth` writes): the family, then the
 * address, the display number, the auth name and the cookie, each with a
 * two-byte big-endian length. The cookie is an MIT-MAGIC-COOKIE-1.
 */
export default function xAuthorityEntry({ display, cookie }: { display: string; cookie: Buffer }) {
    const number = display.replace(/^.*:/, "").replace(/\..*$/, "");

    if (!/^\d+$/.test(number)) throw new Error(`${display} isn't a display.`);
    if (cookie.length != 16) throw new Error("The cookie must be 16 bytes.");

    const family = Buffer.alloc(2);

    family.writeUInt16BE(FamilyWild);

    return Buffer.concat([
        family,
        field({ bytes: Buffer.alloc(0) }),
        field({ bytes: Buffer.from(number, "ascii") }),
        field({ bytes: Buffer.from("MIT-MAGIC-COOKIE-1", "ascii") }),
        field({ bytes: cookie }),
    ]);
}

function field({ bytes }: { bytes: Buffer }) {
    const length = Buffer.alloc(2);

    length.writeUInt16BE(bytes.length);

    return Buffer.concat([length, bytes]);
}
