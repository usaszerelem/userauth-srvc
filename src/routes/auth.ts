import express, { Request, Response } from 'express';
import AppLogger from '../startup/utils/Logger';
import { Limits, User, generateAuthToken } from '../models/users';
import bcrypt from 'bcrypt';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import _ from 'underscore';
import IUserDto from '../dtos/IUserDto';
import { HttpMethod, sendAudit } from '../startup/utils/audit';
import { IAuthUser, IAuthUserResponse } from '../dtos/IAuthUser';
import { sendRbacRoleIds } from '../startup/utils/rbac-srvc';
import { AppEnv, Env } from '../startup/utils/AppEnv';
import JwtPayloadDto from '../dtos/JwtPayloadDto';
import { RouteErrorFormatter, RouteHandlingError } from '../startup/utils/RouteHandlingError';

const router = express.Router();
const logger = new AppLogger(module);

const AuditError = 'Auditing enabled but connection refused.';

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
        validateUserCredentialFields(req.body);

        let user = (await User.findOne({ email: req.body.email })) as IUserDto;

        if (user === null) {
            const success = await sendAudit(
                req.body.email,
                HttpMethod.Post,
                `Authenticated request failed. User ${req.body.email} not registered.`
            );

            if (success === false) {
                throw new RouteHandlingError(424, AuditError);
            }

            throw new RouteHandlingError(400, 'User not registered');
        }

        // compare plain text password with encrypted password

        const validPassword = await bcrypt.compare(req.body.password, user!.password);

        if (!validPassword) {
            const success = await sendAudit(user._id as string, HttpMethod.Post, `Invalid email or password. User ${req.body.email}`);

            if (success === false) {
                throw new RouteHandlingError(424, AuditError);
            }

            throw new RouteHandlingError(400, 'Invalid email or password');
        }

        // Get all service operation Ids that are assigned to the
        // user's role. Ask the RBAC service for this information.

        const serviceOpIds = await sendRbacRoleIds(user.roleIds);
        const token = generateAuthToken(user, serviceOpIds);

        outputAuthTokenExpiration(token);

        logger.info(`User authenticated: ${req.body.email}`);

        // Log successful authentication request

        const success = await sendAudit(user._id as string, HttpMethod.Post, `User authenticated: ${req.body.email}`);

        if (success === false) {
            throw new RouteHandlingError(424, AuditError);
        }

        // Send response to the authentication request. What the user is authorized
        // to perform is encoded within the auth token.

        const authRet: IAuthUserResponse = {
            firstName: user.firstName,
            lastName: user.lastName,
            authToken: token,
        };

        return res.header('x-auth-token', token).status(200).json(authRet);
    } catch (ex: any | Error) {
        const error = RouteErrorFormatter(ex, __filename, 'Authentication request error');
        logger.error(error.message);
        return res.status(error.httpStatus).send(error.message);
    }
});

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

function validateUserCredentialFields(user: IAuthUser): void {
    const schema = Joi.object({
        email: Joi.string().min(Limits.EMAIL_MIN_LENGTH).max(Limits.EMAIL_MAX_LENGTH).required().email(),
        password: Joi.string().min(Limits.PASSWORD_MIN_LENGTH).max(Limits.PASSWORD_MAX_LENGTH).required(),
    });

    const { error } = schema.validate(user);

    if (error) {
        throw new RouteHandlingError(400, error.details[0].message);
    }
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

function outputAuthTokenExpiration(token: string) {
    const decoded = jwt.verify(token, AppEnv.Get(Env.JWT_PRIVATE_KEY)) as JwtPayloadDto;

    const expiration = decoded.exp - decoded.iat;
    logger.debug(`Auth token TTL: ${expiration} seconds`);
}

export default router;
