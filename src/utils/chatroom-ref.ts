type Params = {
    id: number | string;
};

/**
 * How a chatroom is named in a message: `[room:<id>]`. The chat turns it into
 * a link (`linkComputerRefs`) that renders as a chip opening the room.
 */
export default function chatroomRef({ id }: Params) {
    return `[room:${id}]`;
}

/**
 * The link target a chatroom ref becomes, e.g. `#room-5`.
 */
export const ChatroomRefHrefPrefix = "#room-";

/**
 * The id in a chatroom ref's link target, or null.
 */
export function chatroomRefId({ href }: { href?: string | null }) {
    if (!href?.startsWith(ChatroomRefHrefPrefix)) return null;

    const id = Number(href.slice(ChatroomRefHrefPrefix.length));

    return Number.isInteger(id) && id > 0 ? id : null;
}
