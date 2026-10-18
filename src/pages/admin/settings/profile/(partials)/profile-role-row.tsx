import Row from "@moduletrace/twui/layout/Row";
import Tag from "@moduletrace/twui/elements/Tag";
import formatUserType from "../(utils)/format-user-type";

type Props = {
    user_types?: string;
};

export default function ProfileRoleRow({ user_types }: Props) {
    const types = (user_types || "")
        .split(",")
        .map((type) => type.trim())
        .filter(Boolean);

    if (!types[0]) {
        return null;
    }

    return (
        <Row className="gap-2!">
            {types.map((user_type) => (
                <Tag key={user_type} color="gray" variant="outlined">
                    {formatUserType({ user_type })}
                </Tag>
            ))}
        </Row>
    );
}
