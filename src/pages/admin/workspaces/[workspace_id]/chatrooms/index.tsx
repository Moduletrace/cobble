import type { PagePropsType } from "@/src/types";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import ChatroomsList from "@/src/pages/admin/chatrooms/(sections)/chatrooms-list";

export default function WorkspaceChatroomsPage() {
    return <ChatroomsList />;
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const workspace = (params.serverRes?.props as PagePropsType | undefined)?.workspace;

    return {
        title: `Chatrooms | ${workspace?.name || "Workspace"} | ${SiteData["SiteName"]}`,
        description: `Requests between this workspace's bots, through the coordinator.`,
    };
};
