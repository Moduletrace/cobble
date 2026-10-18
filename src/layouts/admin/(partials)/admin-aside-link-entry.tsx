import LinkList from "@moduletrace/twui/elements/LinkList";
import type { AdminAsideLinkItem } from "../(dict)/admin-aside-groups-dict";
import adminAsideLinkToTwuiLink from "../(functions)/admin-aside-link-to-twui-link";
import AdminAsideLinkDropdown from "./admin-aside-link-dropdown";

type Props = {
    link: AdminAsideLinkItem;
};

export default function AdminAsideLinkEntry({ link }: Props) {
    if (link.children && link.children.length > 1) {
        return <AdminAsideLinkDropdown link={link} />;
    }

    return (
        <LinkList
            links={[adminAsideLinkToTwuiLink({ link })]}
            className="flex-col items-stretch"
        />
    );
}
