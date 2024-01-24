import nodemailer from 'nodemailer';
import { AppEnv, Env } from './AppEnv';
import AppLogger from './Logger';
import assert from 'assert';

const logger = new AppLogger(module);

export default class Email {
    private _transporter: any;

    constructor() {
        // https://medium.com/@josewebdev/gmail-email-service-setup-for-code-based-email-sending-8b77d7c0a3c0

        const fromEmailAddress = 'm02688368@gmail.com'; //AppEnv.Get(Env.SERVICE_EMAIL_ADDRESS);
        const fromEmailPassword = 'yrrt pflg uvnj tcqw'; // 'ChangePassword1!'; // AppEnv.Get(Env.SERVICE_EMAIL_PASSWORD);

        assert(fromEmailAddress.length > 0, 'Internal Error: SERVICE_EMAIL_ADDRESS not initialized');
        assert(fromEmailPassword.length > 0, 'Internal Error: SERVICE_EMAIL_PASSWORD not initialized');

        logger.debug(`SERVICE_EMAIL_ADDRESS: ${fromEmailAddress}`);
        logger.debug(`SERVICE_EMAIL_PASSWORD: ${fromEmailPassword}`);

        this._transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: fromEmailAddress,
                pass: fromEmailPassword,
            },
        });
    }

    public async sendOtp(toEmailAddress: string, resetUrl: string): Promise<void> {
        const expMinutes = AppEnv.Get(Env.OTP_EXPIRATION_MINUTES);

        const emailBody = `We received a request to change your password.<br/><br/>
        Click the link below within ${expMinutes} minutes to choose a new password:<br/>
        <a href="${resetUrl}">"Reset your password"</a><br/><br/>
        
        If you received this email by mistake, you can safely ignore it. Your password won't be changed.`;

        var mailOptions = {
            from: AppEnv.Get(Env.SERVICE_EMAIL_ADDRESS),
            to: toEmailAddress,
            subject: 'Reset your password',
            html: emailBody,
        };

        const info = await this._transporter.sendMail(mailOptions);
        logger.info(info.response);
    }
}
