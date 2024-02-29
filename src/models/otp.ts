import { RouteHandlingError } from '../startup/utils/RouteHandlingError';

const mongoose = require('mongoose');
const Joi = require('joi-oid');

// ----------------------------------------------------------------

const otpSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },
    },
    { timestamps: true, versionKey: false, collection: 'otp' }
);

export const Otp = mongoose.model('otp', otpSchema);

// ---------------------------------------------------------------------------
// Validation of the OTP object.
// ---------------------------------------------------------------------------

export function validateOtp(otp: typeof Otp): void {
    const schema = Joi.object({
        userId: Joi.string().required(),
    }).options({ allowUnknown: true });

    const { error } = schema.validate(otp);

    if (error) {
        throw new RouteHandlingError(400, error.details[0].message);
    }
}
