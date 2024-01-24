/**
 * @swagger
 * components:
 *   schemas:
 *     IUserDtoCreate:
 *       required:
 *         - userId
 *         - url
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique OTP entity ID
 *           example: 654bc062b9892e7ba3c3ce89
 *         userId:
 *           type: string
 *           description: Unique user entity ID that needs a one-time password
 *           example: 64f897246ba18769a6f0bc82
 *         url:
 *           type: string
 *           description: OTP url sent to the user via email.
 *         createdAt:
 *           type: string
 *           description: Record created timestamp
 *           example: 2023-11-08T17:07:46.871+00:00
 *         updatedAt:
 *           type: string
 *           description: Record last updated timestamp
 *           example: 2023-11-08T17:07:46.871+00:00
 */

export default interface IOtpDto {
    _id?: string;
    userId: string;
    url: string;
    createdAt?: string;
    updatedAt?: string;
}
