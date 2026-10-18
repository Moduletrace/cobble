import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import H1 from "@moduletrace/twui/layout/H1";
import { ContactChannels } from "../(data)/contact-channels";
import ContactChannelItem from "./contact-channel-item";

export default function ContactInfo() {
    return (
        <Stack className="w-full gap-10! xl:sticky xl:top-28">
            <Stack className="gap-8!">
                <Span className="htag">Contact</Span>
                <H1>
                    Let's talk.{" "}
                    <Span className="text-slate-400">We read everything.</Span>
                </H1>
                <Span className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
                    Questions, feedback or a project in mind. Send a note and a
                    real person will get back to you, usually within one
                    business day.
                </Span>
            </Stack>
            <Stack className="w-full gap-0! border-b border-slate-300 dark:border-white/20">
                {ContactChannels.map((channel, index) => (
                    <ContactChannelItem
                        key={channel.label}
                        {...channel}
                        index={index}
                    />
                ))}
            </Stack>
        </Stack>
    );
}
