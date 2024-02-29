const mongoose = require('mongoose');
const Joi = require('joi-oid');
import jwt from 'jsonwebtoken';
import IUserDto from '../dtos/IUserDto';
import { AppEnv, Env } from '../startup/utils/AppEnv';
import AppLogger from '../startup/utils/Logger';
import isUndefOrEmpty from '../startup/utils/isUndefOrEmpty';
import { RouteHandlingError } from '../startup/utils/RouteHandlingError';

const logger = new AppLogger(module);

// ----------------------------------------------------------------
// Field min/max length

export namespace Limits {
    export const FNAME_MIN_LENGTH = 2;
    export const FNAME_MAX_LENGTH = 20;
    export const LNAME_MIN_LENGTH = 2;
    export const LNAME_MAX_LENGTH = 40;
    export const EMAIL_MIN_LENGTH = 5;
    export const EMAIL_MAX_LENGTH = 255;
    export const PASSWORD_MIN_LENGTH = 5;
    export const PASSWORD_MAX_LENGTH = 12;
}

// ----------------------------------------------------------------
// userId - random GUID type of identifier
// firstName - User's first name
// lastName - User's last name
// email - Used as unique field for authentication
// password - Used with email for authentication
// audit - whether activities performed by this user are audited

const userSchema = new mongoose.Schema(
    {
        isActive: {
            type: Boolean,
            required: true,
        },
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        roleIds: {
            type: Array,
            schema: [{ type: String }],
        },
        serviceOperationIds: {
            type: Array,
            schema: [{ type: String }],
        },
        audit: {
            type: Boolean,
            required: true,
        },
    },
    { timestamps: true, versionKey: false }
);

export const User = mongoose.model('users', userSchema);

// ---------------------------------------------------------------------------
// Store the user's ID and Boolean flag indicating whether the user is an admim
// in the JWT. Based on this simple role based authorization can be made.
// ---------------------------------------------------------------------------

export function generateAuthToken(user: IUserDto, serviceOperationIds: string[]): string {
    let allServiceOps: string[];

    if (user.serviceOperationIds.length > 0) {
        allServiceOps = user.serviceOperationIds.concat(serviceOperationIds);
    } else {
        allServiceOps = serviceOperationIds;
    }

    const payload = { userId: user._id, serviceOperationIds: allServiceOps, audit: user.audit };

    logger.debug(`JwtExpiration: ` + AppEnv.Get(Env.JWT_EXPIRATION));

    const token = jwt.sign(payload, AppEnv.Get(Env.JWT_PRIVATE_KEY), {
        expiresIn: AppEnv.Get(Env.JWT_EXPIRATION),
    });

    return token;
}

// ---------------------------------------------------------------------------
// Validation of the user object.
// ---------------------------------------------------------------------------

export function validateUser(user: typeof User): void {
    const schema = Joi.object({
        firstName: Joi.string().min(Limits.FNAME_MIN_LENGTH).max(Limits.FNAME_MAX_LENGTH).required(),
        lastName: Joi.string().min(Limits.LNAME_MIN_LENGTH).max(Limits.LNAME_MAX_LENGTH).required(),
        email: Joi.string().min(Limits.EMAIL_MIN_LENGTH).max(Limits.EMAIL_MAX_LENGTH).required().email(),
        audit: Joi.boolean().required(),
        roleIds: Joi.array().min(0).items(Joi.string().min(0)),
        serviceOperationIds: Joi.array().min(0).items(Joi.string().min(0)),
    }).options({ allowUnknown: true });

    const { error } = schema.validate(user);

    if (error !== undefined && error.details[0].message.length > 0) {
        return error.details[0].message.length;
    } else {
        for (let i = 0; i < user.roleIds.length; i++) {
            if (user.roleIds[i].length === 0) {
                throw new RouteHandlingError(400, 'Invalid role identifiers found');
            }
        }

        for (let i = 0; i < user.serviceOperationIds.length; i++) {
            if (user.serviceOperationIds[i].length === 0) {
                throw new RouteHandlingError(400, 'Invalid service operation identifiers found');
            }
        }
    }
}

/**
 * Validates that the password is compliant with the password complexity policy.
 * At this initial version only length is checked for.
 * @param password that should be validated
 * @returns Boolean true if password is valid
 */
export function validatePassword(password: string): void {
    let isValidPassword: boolean = !isUndefOrEmpty(password);

    if (isValidPassword === true && (password.length < Limits.PASSWORD_MIN_LENGTH || password.length > Limits.PASSWORD_MAX_LENGTH)) {
        throw new RouteHandlingError(400, 'Invalid password');
    }
}
