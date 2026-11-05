type Params = {
    opcode: number;
    payload: Buffer;
    /**
     * Four bytes to mask the payload with, as a client must (the agent's
     * own DevTools client); a server's frames go unmasked.
     */
    mask?: Buffer;
};

/**
 * One whole frame (RFC 6455) around a payload: unmasked, as a server
 * sends it, unless a `mask` is given.
 */
export default function encodeWebsocketFrame({ opcode, payload, mask }: Params) {
    const length = payload.length;
    const mask_bit = mask ? 0x80 : 0;
    let header: Buffer;

    if (length < 126) {
        header = Buffer.from([0x80 | opcode, mask_bit | length]);
    } else if (length < 65536) {
        header = Buffer.alloc(4);
        header[0] = 0x80 | opcode;
        header[1] = mask_bit | 126;
        header.writeUInt16BE(length, 2);
    } else {
        header = Buffer.alloc(10);
        header[0] = 0x80 | opcode;
        header[1] = mask_bit | 127;
        header.writeBigUInt64BE(BigInt(length), 2);
    }

    if (!mask) return Buffer.concat([header, payload]);

    const masked = Buffer.from(payload);

    for (let index = 0; index < masked.length; index++) masked[index]! ^= mask[index & 3]!;

    return Buffer.concat([header, mask.subarray(0, 4), masked]);
}
