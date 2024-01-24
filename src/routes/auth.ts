import express, { Request, Response } from 'express';
import AppLogger from '../startup/utils/Logger';
import { Limits, User, generateAuthToken } from '../models/users';
import bcrypt from 'bcrypt';
import Joi from 'joi';
import _ from 'underscore';
import IUserDto from '../dtos/IUserDto';
import { ErrorFormatter } from '../startup/utils/ErrorFormatter';
import { HttpMethod, sendAudit } from '../startup/utils/audit';
import { outputAuthTokenExpiration } from '../middleware/userAuth';
import { IAuthUser, IAuthUserResponse } from '../dtos/IAuthUser';

const router = express.Router();
const logger = new AppLogger(module);

/**
 * @swagger
 * /api/v1/auth:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Authenticate user
 *     description: User Authentiation POST method, requiring the user to provide an email address used during user registration and password. If the decrypted password matches a JWT is returned containing basic info about the user.
 *     operationId: authUser
 *     requestBody:
 *       description: Information required to authenticate a user. See the IAuthUser schema for detailed information that must be provided for authentication.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IAuthUser'
 *     responses:
 *       '200':
 *         description: User was authenticated. See the IAuthUserResponse schema for detailed response provided from this endpoint.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IAuthUserResponse'
 *       '400':
 *         description: Vague message in case authentication failed 'Invalid email or password'.
 */

router.post('/', async (req: Request, res: Response) => {
    try {
        const { error } = validateUserCredentialFields(req.body);

        if (error) {
            logger.error(error.details[0].message);
            return res.status(400).send(error.details[0].message);
        }

        let user = (await User.findOne({ email: req.body.email })) as IUserDto;

        if (user === null) {
            const msg = 'User not registered';
            logger.error(msg);

            sendAudit('unknown', HttpMethod.Post, `Authenticated request failed. User ${req.body.email} not registered`);

            return res.status(400).send(msg);
        }

        // compare plain text password with encrypted password

        const validPassword = await bcrypt.compare(req.body.password, user!.password);

        if (!validPassword) {
            const msg = 'Invalid email or password';
            logger.error(msg);

            sendAudit(user._id as string, HttpMethod.Post, `Invalid password provided by user ${req.body.email}`);

            return res.status(400).send(msg);
        }

        const token = generateAuthToken(user);
        outputAuthTokenExpiration(token);

        logger.info(`User authenticated: ${req.body.email}`);

        // Log successful authentication request

        const success = await sendAudit(user._id as string, HttpMethod.Post, `User authenticated: ${req.body.email}`);

        if (success === false) {
            return res.status(424).send('Audit server not available');
        }

        // Send response to the authentication request

        const authRet: IAuthUserResponse = {
            firstName: user.firstName,
            lastName: user.lastName,
            operations: user.operations,
            authToken: token,
        };

        return res.header('x-auth-token', token).status(200).json(authRet);
    } catch (ex) {
        const msg = ErrorFormatter('Fatal authentication request error', ex, __filename);
        logger.error(msg);
        return res.status(500).send(ex);
    }
});

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

function validateUserCredentialFields(user: IAuthUser): Joi.ValidationResult {
    const schema = Joi.object({
        email: Joi.string().min(Limits.EMAIL_MIN_LENGTH).max(Limits.EMAIL_MAX_LENGTH).required().email(),
        password: Joi.string().min(Limits.PASSWORD_MIN_LENGTH).max(Limits.PASSWORD_MAX_LENGTH).required(),
    });

    return schema.validate(user);
}

export default router;
