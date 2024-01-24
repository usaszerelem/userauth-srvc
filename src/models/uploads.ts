const mongoose = require('mongoose');
const Joi = require('joi-oid');

const ORIGFILE_MIN_LENGTH = 5;
const ORIGFILE_MAX_LENGTH = 200;

// ----------------------------------------------------------------

const uploadSchema = new mongoose.Schema(
    {
        originalFileName: {
            type: String,
            required: true,
        },
        entitiesToProcess: {
            type: Number,
            required: true,
        },
        entitiesSuccess: {
            type: Number,
            required: true,
        },
        entitiesFailed: {
            type: Number,
            required: true,
        },
        entitiesDuplicate: {
            type: Number,
            required: true,
        },
        percentProcessed: {
            type: Number,
            required: true,
        },
        percentSuccess: {
            type: Number,
            required: true,
        },
        percentFailed: {
            type: Number,
            required: true,
        },
        percentDuplicate: {
            type: Number,
            required: true,
        },
        completed: {
            type: Boolean,
            required: true,
        },
        errorCode: {
            type: String,
            required: false,
        },
    },
    { timestamps: true, versionKey: false }
);

export const Upload = mongoose.model('uploads', uploadSchema);

// ---------------------------------------------------------------------------
// Validation of the upload object.
// ---------------------------------------------------------------------------

export function validateUpload(upload: typeof Upload) {
    const schema = Joi.object({
        _id: Joi.objectId(),
        originalFileName: Joi.string().min(ORIGFILE_MIN_LENGTH).max(ORIGFILE_MAX_LENGTH).required(),
        entitiesToProcess: Joi.number().required(),
        entitiesSuccess: Joi.number().required(),
        entitiesFailed: Joi.number().required(),
        entitiesDuplicate: Joi.number().required(),
        percentProcessed: Joi.number().required(),
        percentSuccess: Joi.number().required(),
        percentFailed: Joi.number().required(),
        percentDuplicate: Joi.number().required(),
        completed: Joi.boolean().required(),
        errorCode: Joi.string(),
    }).options({ allowUnknown: false });

    return schema.validate(upload);
}
