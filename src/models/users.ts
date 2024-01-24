const mongoose = require('mongoose');
const Joi = require('joi-oid');
import jwt from 'jsonwebtoken';
import IUserDto from '../dtos/IUserDto';
import { EAllowedOperations } from './EAllowedOperations';
import { AppEnv, Env } from '../startup/utils/AppEnv';
import AppLogger from '../startup/utils/Logger';

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
// operations - Allowed operations for this user. See utils/constants.js
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
        operations: {
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

export function generateAuthToken(user: IUserDto): string {
    const payload = { userId: user._id, operations: user.operations, audit: user.audit };

    logger.debug(`JwtExpiration: ` + AppEnv.Get(Env.JWT_EXPIRATION));

    const token = jwt.sign(payload, AppEnv.Get(Env.JWT_PRIVATE_KEY), {
        expiresIn: AppEnv.Get(Env.JWT_EXPIRATION),
    });

    return token;
}

// ---------------------------------------------------------------------------
// Validation of the user object.
// ---------------------------------------------------------------------------

export function validateUserCreate(user: typeof User) {
    const schema = Joi.object({
        firstName: Joi.string().min(Limits.FNAME_MIN_LENGTH).max(Limits.FNAME_MAX_LENGTH).required(),
        lastName: Joi.string().min(Limits.LNAME_MIN_LENGTH).max(Limits.LNAME_MAX_LENGTH).required(),
        email: Joi.string().min(Limits.EMAIL_MIN_LENGTH).max(Limits.EMAIL_MAX_LENGTH).required().email(),
        password: Joi.string().min(Limits.PASSWORD_MIN_LENGTH).max(Limits.PASSWORD_MAX_LENGTH).required(),
        audit: Joi.boolean().required(),
        operations: Joi.array().items(
            Joi.string()
                .valid(
                    EAllowedOperations.ProdDelete,
                    EAllowedOperations.ProdList,
                    EAllowedOperations.ProdUpsert,
                    EAllowedOperations.UserDelete,
                    EAllowedOperations.UserList,
                    EAllowedOperations.UserUpsert
                )
                .required()
        ),
    }).options({ allowUnknown: true });

    return schema.validate(user);
}

export function validateUserUpdate(user: typeof User) {
    const schema = Joi.object({
        _id: Joi.objectId().required(),
        isActive: Joi.boolean(),
        firstName: Joi.string().min(Limits.FNAME_MIN_LENGTH).max(Limits.FNAME_MAX_LENGTH).required(),
        lastName: Joi.string().min(Limits.LNAME_MIN_LENGTH).max(Limits.LNAME_MAX_LENGTH).required(),
        email: Joi.string().min(Limits.EMAIL_MIN_LENGTH).max(Limits.EMAIL_MAX_LENGTH).required().email(),
        password: Joi.string().min(Limits.PASSWORD_MIN_LENGTH).max(Limits.PASSWORD_MAX_LENGTH),
        audit: Joi.boolean().required(),
        operations: Joi.array().items(
            Joi.string().valid(
                EAllowedOperations.ProdDelete,
                EAllowedOperations.ProdList,
                EAllowedOperations.ProdUpsert,
                EAllowedOperations.UserDelete,
                EAllowedOperations.UserList,
                EAllowedOperations.UserUpsert
            )
        ),
    }).options({ allowUnknown: true });

    return schema.validate(user);
}
