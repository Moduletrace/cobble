import { describe, expect, test } from "bun:test";
import workspacePeopleLines from "./workspace-people-lines";

describe("workspacePeopleLines", () => {
    test("names each person with their id, kind and role there", () => {
        expect(
            workspacePeopleLines({
                people: [
                    { id: 1, first_name: "Ada", last_name: "Lane", email: "ada@x.io", user_types: "super_admin" },
                    { id: 6, first_name: "Bo", email: "bo@x.io", user_types: "admin,member", role: "Ops lead.\nWants checklists." },
                    { id: 9, email: "cy@x.io", user_types: "member", role: "  " },
                ],
            }),
        ).toBe(
            [
                "- user 1: Ada Lane <ada@x.io> (super admin). Role here: none set",
                "- user 6: Bo <bo@x.io> (admin). Role here: Ops lead. / Wants checklists.",
                "- user 9: cy@x.io (member). Role here: none set",
            ].join("\n"),
        );
    });
});
