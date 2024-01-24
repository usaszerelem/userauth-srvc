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

export function validateOtp(otp: typeof Otp) {
    const schema = Joi.object({
        userId: Joi.string().required(),
    }).options({ allowUnknown: true });

    return schema.validate(otp);
}
