/**
 * @swagger
 * components:
 *   schemas:
 *     IUserDtoReturn:
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - audit
 *         - operations
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User's unique ID number that is assigned upon creation
 *           example: 64adc0fe7a9c9d385950dfe2
 *         isActive:
 *           type: boolean
 *           description: Boolean value that specifies whether this user is active or soft deleted
 *           example: true
 *         firstName:
 *           type: string
 *           description: User's first name
 *           example: John
 *         lastName:
 *           type: string
 *           description: User's last name
 *           example: Smith
 *         email:
 *           type: string
 *           description: User's email address
 *           example: john@email.com
 *         audit:
 *           type: boolean
 *           description: Boolean value that specifies whether this user's operations should be audited.
 *           example: true
 *         operations:
 *           type: array
 *           description: List of operations that this user is allowed to perform.
 *           items:
 *             type: string
 *           example: ["UserUpsert", "UserDelete", "UserList", "ProdUpsert", "ProdDelete", "ProdList"]
 *         createdAt:
 *           type: string
 *           description: Timestamp of when this entity was created
 *           example: "2023-08-16T13:45:42.676Z"
 *         updatedAt:
 *           type: string
 *           description: Timestamp of when this entity was last updated
 *           example: "2023-08-16T13:45:42.676Z"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     IUsersFilterResponse:
 *       type: object
 *       description: Paging information about requested users. The array of users only contains the requested product fields and the information is sorted by the specified field.
 *       properties:
 *         pageSize:
 *           type: number
 *           example: 10
 *           description: Maximum number of entities that this page can contain.
 *         pageNumber:
 *           type: number
 *           example: 2
 *           description: Requested page number of entities.
 *         _links:
 *           type: object
 *           properties:
 *             base:
 *               type: string
 *               example: "http://localhost:3000/api/users"
 *               description: Base URL to use for retrieving users information
 *             prev:
 *               type: string
 *               example: "http://localhost:3000/api/users?pageSize=10&pageNumber=1"
 *               description: URL to use to retreive the previous page with users information. This property is only returned if there is a previous page with information, therebody allowing the UI to enable/disable paging controls.
 *             next:
 *               type: string
 *               example: "http://localhost:3000/api/users?pageSize=10&pageNumber=3"
 *               description: URL to use to retreive the next page with users information. This property is only returned if there is a next page with information, therebody allowing the UI to enable/disable paging controls.
 *         results:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IUserDto'
 */

export default interface IUserDto {
    _id?: string;
    isActive: boolean;
    audit: boolean;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    roleIds: string[];
    serviceOperationIds: string[];

    createdAt?: string;
    updatedAt?: string;
}
