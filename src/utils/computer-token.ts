import { createHmac } from "node:crypto";

type Params = {
    computer_id: number | string;
    /**
     * The app's `ENCRYPTION_KEY`; tests pass their own.
     */
    key?: string;
};

/**
 * The secret a computer's agent asks of every request
 * (`COBBLE_COMPUTER_TOKEN` in its container, sent as `Authorization:
 * Bearer`), so another computer on the docker network (a bot's shell
 * there) can't drive it. Derived from the app's key and the computer's
 * id, so nothing is stored and a recreated container gets the same one.
 */
export default function computerToken({ computer_id, key = process.env.ENCRYPTION_KEY }: Params) {
    if (!key) throw new Error("ENCRYPTION_KEY isn't set, so computers can't be given a token.");

    return createHmac("sha256", key).update(`cobble-computer:${Number(computer_id)}`).digest("hex");
}
