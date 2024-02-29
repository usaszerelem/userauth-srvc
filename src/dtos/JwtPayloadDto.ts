/**
 * @swagger
 * components:
 *   schemas:
 *     JwtPayloadDto:
 *       required:
 *         - userId
 *         - operations
 *         - audit
 *         - iat
 *         - exp
 *       type: object
 *       description: JSON Web Token format.
 *       properties:
 *         userId:
 *           type: string
 *           example: 64adc0fe7a9c9d385950dfe2
 *           description: Unique user identifier
 *         serviceOperationIds:
 *           type: array
 *           description: List of service operations that this user is allowed to perform.
 *           items:
 *             type: string
 *             example: ["65b8179a3dc27454e0bc8978", "65b8179a3dc27454e0bc8979"]
 *         audit:
 *           type: boolean
 *           description: Boolean value that specifies whether this user's operations should be audited.
 *           example: false
 *         iat:
 *           type: number
 *           description: This is the time at which the JWT was created, and can be used to determine the age of the JWT.
 *           example: 1445714161
 *         exp:
 *           type: number
 *           description: Timestamp that indicates the expiration time of the JWT
 *           example: 1445714161
 */

export default interface JwtPayloadDto {
    userId: string;
    serviceOperationIds: string[];
    audit: boolean;
    iat: number;
    exp: number;
}
