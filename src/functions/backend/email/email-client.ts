import nodemailer from "nodemailer";

const SMTPTimeoutMilliseconds = 15 * 1000;

const EmailClient = nodemailer.createTransport({
    host: process.env.EMAIL_DOMAIN,
    port: 465,
    secure: true,
    connectionTimeout: SMTPTimeoutMilliseconds,
    greetingTimeout: SMTPTimeoutMilliseconds,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export default EmailClient;
