import type { WorkspacePerson } from "@/src/types";
import parseUserTypes from "./parse-user-types";
import personName from "./person-name";

type Params = {
    people: WorkspacePerson[];
};

/**
 * Who works in a workspace, one line each for a bot: user id, name, email,
 * whether they're the super admin or an admin, and their role there.
 */
export default function workspacePeopleLines({ people }: Params) {
    return people
        .map((person) => {
            const types = parseUserTypes({ user_types: person.user_types });
            const kind = types.includes("super_admin") ? "super admin" : types.includes("admin") ? "admin" : "member";
            const name = personName(person);
            const email = person.email && person.email != name ? ` <${person.email}>` : "";
            const role = person.role?.trim().replace(/\s*\n\s*/g, " / ");

            return `- user ${person.id}: ${name}${email} (${kind}). Role here: ${role || "none set"}`;
        })
        .join("\n");
}
