import express, { Request, Response } from 'express';
import AppLogger from '../startup/utils/Logger';
import { ErrorFormatter } from '../startup/utils/ErrorFormatter';
import { Otp } from '../models/otp';
import { AppEnv, Env } from '../startup/utils/AppEnv';
import moment from 'moment';
import { ObjectId } from 'mongodb';
import { User } from '../models/users';
import Email from '../startup/utils/Email';
import { PasswordValidator, ValidationType } from '../startup/utils/PassValidator';
import IOtpDto from '../dtos/IOtp';
import { encryptPassword } from '../startup/utils/hash';

const router = express.Router();
const logger = new AppLogger(module);

/**
 * @swagger
 * /api/v1/otp/passwordresetrequest:
 *   post:
 *     tags:
 *       - Password Reset Request
 *     summary: Password reset request
 *     description: A user can request its password to be updated. If the user is recognized, an email is sent to the user's email address with a hyperlink to click for the password reset form. The hyperlink contains a unique one-time-password ID that is time sensitive. This ID should be provided together with the new password.
 *     operationId: resetPassword
 *     parameters:
 *     requestBody:
 *       description: The UI is requested to send a JSON object containing the user's email address and URL that should be included in the email to the user.
 *                    *email* This is the user's email address that will be sent an email containing a reset password URL to click. The UI will display a reset password screen
 *                    *resetUrl* This URL is added as a hyperlink in the email so that when the user clicks on it, a UI will display the reset password form or the user. A query parameter is added to this URL that contains a unique OTP identifier. The form that is displayed to the user is requested to forward this unique OTP identifier together with the updated password.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               resetUrl:
 *                 type: string
 *               required:
 *                 - email
 *                 - resetUrl
 *           example:
 *             email: mickey.mouse@disney.com
 *             resetUrl: https://acme.com/passwordreset
 *     responses:
 *       '200':
 *         description: Success. An email was sent to the user with a link
 *       '400':
 *         description: Invalid parameters were provided.
 *       '500':
 *         description: Fatal internal error.
 */

router.post('/passwordresetrequest', async (req: Request, res: Response) => {
    let otpDocId: string | undefined = undefined;

    try {
        const userEmail: string = req.body.email as string;
        let resetUrl: string = req.body.resetUrl as string;

        if (userEmail === undefined || resetUrl === undefined) {
            const msg = `Password reset. Invalid parameters`;
            logger.error(msg);
            return res.status(400).send(msg);
        }

        // --------------------------------------------------
        // First check is user with specified entity exists

        let user = await User.findOne({ email: userEmail });

        if (user === null) {
            const msg = `Password reset. User not found: ${userEmail}`;
            logger.error(msg);
            return res.status(400).send(msg);
        }

        // --------------------------------------------------
        // User exists. Now check if there is already a password request
        // document in the OTP table. If there is, then delete it.

        let otp = await Otp.findOne({ userId: user._id });

        // --------------------------------------------------
        // Only one record per user in the table

        if (otp !== null) {
            await Otp.deleteOne({ userId: user._id });
        }

        // --------------------------------------------------
        // Create a new password request document in the OTP table.
        // The unique entity ID for this document is needed.

        otp = new Otp({ userId: user._id });
        otp = await otp.save();

        logger.info(`Otp created: ` + JSON.stringify(otp));

        // --------------------------------------------------
        // Create an email to the user with a reset password link
        // This link launches the browser and a page that just
        // passes the below url to this back-end service.
        // If the link did not expire, a 200 response is given
        // otherwise a 400 response. Based on this the page
        // base redirect to a password reset page or inform
        // the user that the token expired.

        if (resetUrl.lastIndexOf('?') === -1) {
            resetUrl = resetUrl + `?id=${otp._id}`;
        } else {
            resetUrl = resetUrl + `&id=${otp._id}`;
        }

        const email = new Email();
        await email.sendOtp(user.email, resetUrl);

        return res.status(201).send('Success');
    } catch (ex) {
        // if some error happened and we created a new Otp document
        // then delete it so we do not leave garbage hanging around.

        if (otpDocId !== undefined) {
            await Otp.deleteOne({ _id: otpDocId });
        }

        const msg = ErrorFormatter('Fatal error user password reset request', ex, __filename);
        logger.error(msg);
        return res.status(500).send(msg);
    }
});

/**
 * This endpoint is called from the UI with the new password to be assigned
 * to the requested user. Information that is provided in the POST body:
 *
 * newPassword - This is the new password that the UI collected from the user
 * otpEntityId - Unique OTP ID provided to the caller in the passwordresetrequest
 *               endpoint call.
 *
 * Example POST body:
 * {
 *      "password": "Abcdefg%5";
 *      "otpEntityId": "64adc0fe7a9c9d385950dfe2"
 * }
 */

/**
 * @swagger
 * /api/v1/otp/passwordreset:
 *   post:
 *     tags:
 *       - Password Reset
 *     summary: Password reset.
 *     description: An application calls this endpoint with the user provided new password and the unique OTP id number to reset a user's password.
 *     operationId: resetPassword
 *     parameters:
 *     requestBody:
 *       description: The body of this POST call contains a JSON object with the new password and unique OTP ID that was obtained from the request call.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *               otpEntityId:
 *                 type: string
 *               required:
 *                 - password
 *                 - otpEntityId
 *           example:
 *             password: ChangeMe1!
 *             otpEntityId: A18DC9358702349BA
 *     responses:
 *       '200':
 *         description: Success. An email was sent to the user with a link
 *       '400':
 *         description: Invalid parameters were provided.
 *       '500':
 *         description: Fatal internal error.
 */

router.post('/passwordreset/', async (req: Request, res: Response) => {
    try {
        const newPassword: string = req.body.password as string;
        const otpEntityId = new ObjectId(req.body.otpEntityId);

        if (newPassword === undefined || otpEntityId === undefined) {
            const msg = `Password reset. Invalid parameters`;
            logger.error(msg);
            return res.status(400).send(msg);
        }

        logger.info(`Reset password URL requested for "${req.body.otpEntityId}"`);

        let otp: IOtpDto = await Otp.findById(otpEntityId);

        if (otp === null) {
            return res.status(404).send('One time password token was already used.');
        }

        logger.debug(JSON.stringify(otp, null, 2));

        // ---------------------------------
        // Check if otp link expired.

        var start = moment(otp.createdAt, 'HH:mm:ss');
        var minutesPassed = moment().diff(start, 'minutes');
        var minutesExpired = parseInt(AppEnv.Get(Env.OTP_EXPIRATION_MINUTES));

        if (minutesPassed > minutesExpired) {
            minutesExpired -= minutesPassed;
            const msg = 'Password request for user ' + otp.userId + ' expired ' + Math.abs(minutesExpired) + ' minutes ago';
            logger.error(msg);
            return res.status(400).send(msg);
        }

        // ------------------------------------------------
        // Ensure provided password meets password policy.

        let pwValidator = PasswordValidator.getInstance();
        const retStatus: ValidationType[] = pwValidator.validate(newPassword);

        if (retStatus.length > 0) {
            let errMsg = 'Password validation failed: ';

            for (let i = 0; i < retStatus.length; i++) {
                errMsg = errMsg + retStatus[i].toString();
            }

            logger.error(errMsg);
            return res.status(400).send(errMsg);
        }

        const password = await encryptPassword(newPassword);
        const user = await User.findByIdAndUpdate(otp.userId, { password: password }, { new: true });

        if (user === undefined) {
            throw Error('Unable to update password for user');
        }

        // TODO: VALIDATE
        logger.info('User was updated. userId: ' + otp.userId);
        logger.debug(JSON.stringify(user, null, 2));

        // This OTP document can now be deleted as the password was successfully reset.
        await Otp.deleteOne({ _id: otp._id });

        return res.status(200).send('Password was updated.');
    } catch (ex) {
        const msg = ErrorFormatter('Fatal error in password reset', ex, __filename);
        logger.error(msg);
        return res.status(500).send(msg);
    }
});

export default router;
