/**
 * One whole, unmasked server frame (RFC 6455) around a payload.
 */
export default function encodeWebsocketFrame({ opcode, payload }: { opcode: number; payload: Buffer }) {
    const length = payload.length;
    let header: Buffer;

    if (length < 126) {
        header = Buffer.from([0x80 | opcode, length]);
    } else if (length < 65536) {
        header = Buffer.alloc(4);
        header[0] = 0x80 | opcode;
        header[1] = 126;
        header.writeUInt16BE(length, 2);
    } else {
        header = Buffer.alloc(10);
        header[0] = 0x80 | opcode;
        header[1] = 127;
        header.writeBigUInt64BE(BigInt(length), 2);
    }

    return Buffer.concat([header, payload]);
}
