import { twMerge } from "tailwind-merge";
import Tag from "@moduletrace/twui/elements/Tag";
import Row from "@moduletrace/twui/layout/Row";
import { TriangleAlert, CircleCheck } from "lucide-react";
import type { PropsWithChildren } from "react";
import type { TWUIStatusType } from "@moduletrace/twui/hooks/useStatus";
import Paper from "@moduletrace/twui/elements/Paper";

type Props = PropsWithChildren & {
    title?: string;
    className?: string;
    status?: TWUIStatusType;
};

export default function LoginShell({ children, className, status }: Props) {
    return (
        <>
            <Paper
                className={twMerge(
                    "w-full flex-col items-center",
                    "px-4 sm:px-6 py-8 shadow-md relative",
                    className,
                )}
            >
                {status?.error && status.msg ? (
                    <Tag
                        variant="outlined"
                        color="error"
                        className="w-full py-1.5 outline-error/50 bg-error/5!"
                    >
                        <Row>
                            <TriangleAlert size={15} />
                            <span>{status.msg}</span>
                        </Row>
                    </Tag>
                ) : null}
                {status?.success && status.msg ? (
                    <Tag
                        variant="outlined"
                        color="success"
                        className="w-full py-1.5 outline-success/50 bg-success/5!"
                    >
                        <Row>
                            <CircleCheck size={15} />
                            <span>{status.msg}</span>
                        </Row>
                    </Tag>
                ) : null}
                {children}
            </Paper>
        </>
    );
}
