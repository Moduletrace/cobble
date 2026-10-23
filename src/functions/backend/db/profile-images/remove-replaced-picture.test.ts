import { describe, expect, test } from "bun:test";
import removeReplacedPicture from "./remove-replaced-picture";

function spy({ is_picture = true }: { is_picture?: boolean } = {}) {
    const asked: unknown[] = [];
    const removed: unknown[] = [];

    return {
        asked,
        removed,
        isPicture: async (params: { media_id: number | string; target: "bot" | "workspace" }) => {
            asked.push(params);
            return is_picture;
        },
        remove: async (params: unknown) => {
            removed.push(params);
            return { success: true };
        },
    };
}

describe("removeReplacedPicture", () => {
    test("deletes the picture a bot no longer shows", async () => {
        const deps = spy();

        await removeReplacedPicture({
            previous: 4,
            next: 9,
            user_id: 3,
            isPicture: deps.isPicture,
            remove: deps.remove,
        });

        expect(deps.asked).toEqual([{ media_id: 4, target: "bot" }]);
        expect(deps.removed).toEqual([{ id: 4, user_id: 3 }]);
    });

    test("never deletes a row that isn't a picture, such as a chat upload", async () => {
        const deps = spy({ is_picture: false });

        await removeReplacedPicture({
            previous: 4,
            next: 9,
            user_id: 3,
            isPicture: deps.isPicture,
            remove: deps.remove,
        });

        expect(deps.removed).toHaveLength(0);
    });

    test("leaves a bot that had no picture alone", async () => {
        const deps = spy();

        await removeReplacedPicture({ previous: null, next: 9, user_id: 3, isPicture: deps.isPicture, remove: deps.remove });

        expect(deps.asked).toHaveLength(0);
        expect(deps.removed).toHaveLength(0);
    });

    test("keeps the picture that is still in use, e.g. naming it twice", async () => {
        const deps = spy();

        await removeReplacedPicture({ previous: 4, next: 4, user_id: 3, isPicture: deps.isPicture, remove: deps.remove });
        await removeReplacedPicture({ previous: "4", next: 4, user_id: 3, isPicture: deps.isPicture, remove: deps.remove });

        expect(deps.removed).toHaveLength(0);
    });

    test("asks for the right kind of picture, a workspace's or a bot's", async () => {
        const deps = spy();

        await removeReplacedPicture({
            previous: 4,
            next: null,
            user_id: 3,
            target: "workspace",
            isPicture: deps.isPicture,
            remove: deps.remove,
        });

        expect(deps.asked).toEqual([{ media_id: 4, target: "workspace" }]);
    });
});
