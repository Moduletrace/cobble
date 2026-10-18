import MobileNav from "../(partials)/MobileNav";
import Section from "@moduletrace/twui/layout/Section";
import Container from "@moduletrace/twui/layout/Container";
import Row from "@moduletrace/twui/layout/Row";
import Logo from "@/src/components/general/logo";
import HeaderNav from "@moduletrace/twui/elements/HeaderNav";
import { MainLinks } from "@/src/dict/main-links-dict";
import Button from "@moduletrace/twui/layout/Button";
import HeaderUser from "../(partials)/header-user";
import { useAuthStatus } from "@/src/hooks/use-auth-status";

export default function Header() {
    const { is_logged_in } = useAuthStatus();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-light/80 backdrop-blur-md dark:border-white/10 dark:bg-background-dark/80">
            <Section className="py-0!">
                <Container className="w-full justify-between">
                    <Row className="w-full items-center justify-between flex-nowrap py-4">
                        <Logo icon_size={28} />

                        <div className="hidden xl:flex">
                            <HeaderNav headerLinks={MainLinks} />
                        </div>

                        <Row className="flex-nowrap items-center gap-2!">
                            {!is_logged_in ? (
                                <>
                                    <Button
                                        title="Log in"
                                        href="/auth/login"
                                        variant="ghost"
                                        color="gray"
                                        size="small"
                                        className="hidden sm:flex"
                                    >
                                        Log in
                                    </Button>
                                    <Button
                                        title="Get started"
                                        href="/auth/signup"
                                        size="small"
                                    >
                                        Get started
                                    </Button>
                                </>
                            ) : null}
                            <MobileNav />
                            <HeaderUser />
                        </Row>
                    </Row>
                </Container>
            </Section>
        </header>
    );
}