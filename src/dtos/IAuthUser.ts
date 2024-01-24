/**
 * @swagger
 * components:
 *   schemas:
 *     IAuthUser:
 *       required:
 *         - email
 *         - password
 *       type: object
 *       description: Mandatory information that should be provided to authenticate a user.
 *       properties:
 *         email:
 *           type: string
 *           description: User's email address
 *           example: john@email.com
 *         password:
 *           type: string
 *           description: User provided password
 *           example: 'SamplePassword12!'
 */

export interface IAuthUser {
    email: string;
    password: string;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     IAuthUserResponse:
 *       required:
 *         - firstName
 *         - lastName
 *         - operations
 *         - authToken
 *       type: object
 *       description: Information returned for authenticated users.
 *       properties:
 *         firstName:
 *           type: string
 *           description: User's first name
 *           example: John
 *         lastName:
 *           type: string
 *           description: User's last name
 *           example: Smith
 *         operations:
 *           type: array
 *           description: List of operations that this user is allowed to perform.
 *           items:
 *             type: string
 *           example: ["UserUpsert", "UserDelete", "UserList", "ProdUpsert", "ProdDelete", "ProdList"]
 *         authToken:
 *           type: string
 *           description: Encoded JWT
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NGJmNWJhM2QwYzhkOTNhZDNlYTQ3YTQiLC"
 */

export interface IAuthUserResponse {
    firstName: string;
    lastName: string;
    operations: string[];
    authToken: string;
}
