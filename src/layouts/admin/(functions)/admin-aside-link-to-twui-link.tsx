import type { TWUI_LINK_LIST_LINK_OBJECT } from "@moduletrace/twui/elements/LinkList";
import type { AdminAsideLinkItem } from "../(dict)/admin-aside-groups-dict";

type Params = {
    link: AdminAsideLinkItem;
};

export default function adminAsideLinkToTwuiLink({
    link,
}: Params): TWUI_LINK_LIST_LINK_OBJECT {
    const { title, url, strict, Icon } = link;

    return {
        title,
        url,
        strict,
        icon: <Icon size={16} strokeWidth={1.75} />,
    };
}
