import { useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import Row from "@moduletrace/twui/layout/Row";
import _ from "lodash";
import useFormInit from "@/src/hooks/use-form-init";
import type { UserFormObject } from "@/src/types";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import grabMediaURL from "@/src/functions/backend/media/grab-media-url";
import SettingsGroup from "../../(partials)/settings-group";
import SettingsSaveBar from "../../(partials)/settings-save-bar";
import { ProfileFields } from "../(data)/profile-fields";
import isProfileDirty from "../(utils)/is-profile-dirty";
import submitProfileForm from "../(functions)/submit-profile-form";
import ProfilePhotoField from "./profile-photo-field";
import ProfileTextField from "./profile-text-field";
import ProfileRoleRow from "./profile-role-row";

type Props = {
    person: BUN_SQLITE_COBBLE_USERS_JOIN;
};

export default function ProfileForm({ person }: Props) {
    const [saved, setSaved] = useState(
        () => _.pick(person, ProfileFields) as UserFormObject,
    );
    const [saved_photo_src, setSavedPhotoSrc] = useState(() =>
        person.profile_media_id
            ? grabMediaURL({ media: { id: person.profile_media_id } })
                  .media_url
            : undefined,
    );
    /**
     * Inputs are uncontrolled; bumping this remounts them on Discard.
     */
    const [form_key, setFormKey] = useState(0);
    const [notice, setNotice] = useState<string>();

    const init = useFormInit<UserFormObject>({
        existing: saved,
        existing_full: { id: person.id },
    });
    const { form, setForm, image, setImage, loading, status, setStatus } =
        init;

    const dirty = isProfileDirty({ form, existing: saved, image });
    const initials = [saved.first_name, saved.last_name]
        .filter(Boolean)
        .map((part) => String(part).charAt(0).toUpperCase())
        .join("");

    const discard = () => {
        setForm(saved);
        setImage(undefined);
        setStatus({});
        setNotice(undefined);
        setFormKey((prev) => prev + 1);
    };

    return (
        <Form
            key={form_key}
            className="w-full gap-0! items-stretch"
            onSubmit={() => {
                if (!dirty || loading) return;
                if (!window.confirm(`Save your profile?`)) return;
                submitProfileForm({
                    ...init,
                    onSaved: ({ saved, photo_src, msg }) => {
                        setSaved(saved);
                        setImage(undefined);
                        if (photo_src) setSavedPhotoSrc(photo_src);
                        setNotice(msg);
                    },
                });
            }}
        >
            <SettingsGroup title="Photo">
                <ProfilePhotoField
                    saved_src={saved_photo_src}
                    initials={initials}
                    image={image}
                    setImage={(next) => {
                        setStatus({});
                        setImage(next);
                    }}
                    disabled={loading}
                />
            </SettingsGroup>

            <SettingsGroup title="Name" description="How you appear in the app.">
                <Row className="w-full grid sm:grid-cols-2 gap-4!">
                    <ProfileTextField
                        form={form}
                        setForm={setForm}
                        field="first_name"
                        label="First name"
                        autoComplete="given-name"
                        required
                    />
                    <ProfileTextField
                        form={form}
                        setForm={setForm}
                        field="last_name"
                        label="Last name"
                        autoComplete="family-name"
                    />
                </Row>
            </SettingsGroup>

            <SettingsGroup
                title="Login"
                description="You can log in with either of these."
            >
                <ProfileTextField
                    form={form}
                    setForm={setForm}
                    field="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    required
                />
                <ProfileTextField
                    form={form}
                    setForm={setForm}
                    field="username"
                    label="Username"
                    autoComplete="username"
                    info="3 to 32 characters: lowercase letters, numbers, dots, dashes or underscores."
                    required
                />
            </SettingsGroup>

            <SettingsGroup
                title="About you"
                description="A few lines about you and what you do."
            >
                <ProfileTextField
                    form={form}
                    setForm={setForm}
                    field="bio"
                    label="About you"
                    placeholder="I run a small studio and handle the books myself."
                    multiline
                />
            </SettingsGroup>

            <SettingsGroup title="Role" description="Set when your account was made.">
                <ProfileRoleRow user_types={person.user_types} />
            </SettingsGroup>

            <SettingsSaveBar
                dirty={dirty}
                loading={loading}
                status={
                    status?.msg
                        ? status
                        : !dirty && notice
                          ? { success: true, msg: notice }
                          : undefined
                }
                onDiscard={discard}
            />
        </Form>
    );
}
