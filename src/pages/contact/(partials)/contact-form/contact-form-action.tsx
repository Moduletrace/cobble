import Button from "@moduletrace/twui/layout/Button";
import useFormInit from "@/src/hooks/use-form-init";
import { type ContactFormObject } from "@/src/types";
import { Send } from "lucide-react";

export default function ContactFormAction({}: ReturnType<
    typeof useFormInit<ContactFormObject>
>) {
    return (
        <>
            <Button
                title="Submit Contact Form"
                type="submit"
                size="large"
                className="w-full mt-2"
                afterIcon={<Send size={17} />}
            >
                Send Message
            </Button>
        </>
    );
}
