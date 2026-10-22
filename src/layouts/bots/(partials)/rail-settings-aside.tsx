import { useContext, type ReactNode } from "react";
import Divider from "@moduletrace/twui/layout/Divider";
import BotAvatar from "@/src/components/general/bot-avatar";
import ComputerIconTile from "@/src/components/general/computer-icon-tile";
import UserAvatar from "@/src/components/general/user-avatar";
import WorkspaceAvatar from "@/src/components/general/workspace-avatar";
import { UserTypes } from "@/src/dict/user-types-dict";
import type { BotFace, BotHue } from "@/src/dict/bot-dict";
import {
    SettingsRecordBack,
    SettingsRecordSections,
} from "@/src/dict/settings-record-sections-dict";
import { AppContext } from "@/src/pages/__root";
import computerResourcesLabel from "@/src/utils/computer-resources-label";
import computerStatusLabel from "@/src/utils/computer-status-label";
import parseSettingsRecordPath from "@/src/utils/parse-settings-record-path";
import parseUserTypes from "@/src/utils/parse-user-types";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import RailBackLink from "./rail-back-link";
import RailSettingsLink from "./rail-settings-link";
import RailSettingsList from "./rail-settings-list";
import RailSettingsRecordRow from "./rail-settings-record-row";

type Props = {
    pathname?: string;
};

/**
 * Settings mode of the rail. On a list page it shows the settings sub
 * pages; on a bot, workspace or user record page it drills into that
 * record: a back link to its list, the record, then its sections.
 */
export default function RailSettingsAside({ pathname }: Props) {
    const { pageProps } = useContext(AppContext);
    const record = parseSettingsRecordPath({ pathname });

    if (!record) {
        return <RailSettingsList pathname={pathname} />;
    }

    const back = SettingsRecordBack[record.kind];
    const is_super_admin = isPassThroughUser({
        user_types: pageProps?.user_types,
    });
    const sections = SettingsRecordSections[record.kind].filter((section) => {
        if (
            record.kind == "bots" &&
            section.url == "#delete" &&
            pageProps?.bot?.kind == "coordinator"
        ) {
            return false;
        }

        if (
            record.kind == "computers" &&
            !is_super_admin &&
            (section.url == "#details" || section.url == "#danger")
        ) {
            return false;
        }

        if (section.url == "#models") {
            return record.kind == "bots"
                ? Boolean(pageProps?.bot_harness_overview?.harnesses?.length)
                : record.kind == "workspaces"
                  ? Boolean(
                        pageProps?.workspace_harness_overview?.harnesses
                            ?.length,
                    )
                  : true;
        }

        return true;
    });

    let avatar: ReactNode = null;
    let title = "";
    let subtitle = "";

    if (record.kind == "bots") {
        const bot = pageProps?.bot;

        if (!bot?.id) return <RailSettingsList pathname={pathname} />;

        title = bot.name || `Bot ${bot.id}`;
        subtitle =
            bot.role ||
            (bot.kind == "coordinator"
                ? "Coordinates your crew"
                : "Worker bot");
        avatar = (
            <BotAvatar
                image_media_id={bot.image_media_id}
                hue={(bot.hue || null) as BotHue | null}
                face={(bot.face || "idle") as BotFace}
            />
        );
    } else if (record.kind == "workspaces") {
        const workspace = pageProps?.workspace;

        if (!workspace?.id) return <RailSettingsList pathname={pathname} />;

        title = workspace.name || `Workspace ${workspace.id}`;
        subtitle = workspace.description || "A workspace";
        avatar = <WorkspaceAvatar image_media_id={workspace.image_media_id} />;
    } else if (record.kind == "users") {
        const person = pageProps?.target_person;

        if (!person?.id) return <RailSettingsList pathname={pathname} />;

        const types = UserTypes.filter((type) =>
            parseUserTypes({ user_types: person.user_types }).includes(
                type.value,
            ),
        )
            .map((type) => type.title)
            .join(", ");

        title =
            [person.first_name, person.last_name].filter(Boolean).join(" ") ||
            person.email ||
            `User ${person.id}`;
        subtitle = types || person.email || "User";
        avatar = <UserAvatar person={person} size="md" />;
    } else {
        const computer = pageProps?.computer;

        if (!computer?.id) return <RailSettingsList pathname={pathname} />;

        title = computer.name || `Computer ${computer.id}`;
        subtitle = [
            computerStatusLabel({ computer }),
            computerResourcesLabel({ computer }),
        ].join(" · ");
        avatar = <ComputerIconTile />;
    }

    return (
        <>
            <RailBackLink title={back.title} href={back.href} />
            {/* <Divider className="shrink-0 mx-1 @rail:mx-3 my-2 w-auto border-hairline dark:border-hairline" /> */}
            <RailSettingsRecordRow
                avatar={avatar}
                title={title}
                subtitle={subtitle}
            />
            {sections.map((section) => (
                <RailSettingsLink key={section.url} {...section} />
            ))}
        </>
    );
}
