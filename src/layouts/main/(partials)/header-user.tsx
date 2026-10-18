import Row from "@moduletrace/twui/layout/Row";
import Dropdown from "@moduletrace/twui/elements/Dropdown";
import Img from "@moduletrace/twui/layout/Img";
import Paper from "@moduletrace/twui/elements/Paper";
import LinkList from "@moduletrace/twui/elements/LinkList";
import Divider from "@moduletrace/twui/layout/Divider";
import { useLocalUser } from "@/src/hooks/use-local-user";

export default function HeaderUser() {
    const { user } = useLocalUser();

    if (!user?.logged_in_status) {
        return null;
    }

    return (
        <Row className="">
            <Dropdown
                target={
                    <Img
                        alt="Logged in user image"
                        src={user.image_thumbnail ?? "/icons/man.png"}
                        size={32}
                        circle
                        className="bg-slate-300 dark:bg-slate-700 ring-1 ring-slate-200 dark:ring-white/10 cursor-pointer"
                        title={
                            user.first_name +
                            (user.last_name ? ` ${user.last_name}` : "")
                        }
                    />
                }
                position="bottom-right"
            >
                <Paper className="min-w-[200px] px-0! py-2 header-user-dropdown">
                    <LinkList
                        links={[
                            {
                                title: "Bots",
                                url: "/admin/bots",
                            },
                            {
                                component: <Divider />,
                            },
                            {
                                title: "Settings",
                                url: "/admin/settings",
                            },
                            {
                                title: "Logout",
                                url: "/auth/logout",
                            },
                        ]}
                        className="flex-col items-stretch w-full"
                    />
                </Paper>
            </Dropdown>
        </Row>
    );
}
