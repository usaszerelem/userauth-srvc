import express, { Request, Response } from 'express';
import AppLogger from '../startup/utils/Logger';
import { User, validatePassword, validateUser } from '../models/users';
import { encryptPassword } from '../startup/utils/hash';
import _ from 'underscore';
import { RequestDto } from '../dtos/RequestDto';
import IUserDto from '../dtos/IUserDto';
import { HttpMethod, auditAuthUserActivity } from '../startup/utils/audit';
import { buildResponse, getFilter, getSortField, selectFields } from './common';
import { IEntityReturn } from '../dtos/IEntityReturn';
import parseBool from '../startup/utils/parseBool';
import userAuth from '../middleware/userAuth';
import userCanList from '../middleware/userCanList';
import userCanDelete from '../middleware/userCanDelete';
import userCanUpsert from '../middleware/userCanUpsert';
import { RouteErrorFormatter, RouteHandlingError } from '../startup/utils/RouteHandlingError';

const router = express.Router();
const logger = new AppLogger(module);

const AuditError = 'Auditing enabled but connection refused.';

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create user
 *     description: User creation can only be done by a logged in user that has 'UserUpsert' operational permission.
 *     operationId: createUser
 *     parameters:
 *       - in: header
 *         name: x-auth-token
 *         required: true
 *         description: Authentication token of the logged in user
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Information about the user to create. For detailed information of what is requested to be provided, please see the below schema.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IUserDto'
 *     responses:
 *       '201':
 *         description: User successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IUserDtoReturn'
 *       '400':
 *         description: User already registered or missing field from request.
 *       '424':
 *         description: User was created, but auditing is enabled and the Audit server is not available
 */

router.post('/', [userAuth, userCanUpsert], async (req: Request, res: Response) => {
    try {
        // Ensure password is not exposed
        let userMinData = _.pick(req.body, ['email', 'operations']);
        logger.info(`User Create received:` + JSON.stringify(userMinData));

        const newUser: IUserDto = { ...req.body, ...{ isActive: true } };

        validateUser(newUser);

        if ((await User.findOne({ email: newUser.email })) !== null) {
            // Only one user with the same email can exist.
            // Unfortunatelly dynamoose dose note have the
            // 'unique' schema attribute like mongoose so this
            // manual check must be done.
            throw new RouteHandlingError(400, `User already registered: ${newUser.email}`);
        }

        validatePassword(newUser.password);

        let password = await encryptPassword(newUser.password);
        let user = new User(newUser);
        user.password = password;

        user = await user.save();
        logger.info(`User ${user._id} created.`);

        // Return minimal information for the created user. Important to note
        // that the call to 'toObject()' is necessary because the way mongoose
        // works with TypeScript.

        user = user.toObject();
        user = _.omit(user, 'password');

        const dataToSend = JSON.stringify(user);
        const success = await auditAuthUserActivity(req as RequestDto, HttpMethod.Post, dataToSend);

        if (success === false) {
            throw new RouteHandlingError(424, AuditError);
        }

        return res.status(201).json(user);
    } catch (ex) {
        const error = RouteErrorFormatter(ex, __filename, 'Fatal error User POST');
        logger.error(error.message);
        return res.status(error.httpStatus).send(error.message);
    }
});

/**
 *
 */
//router.post('/resetpassword', [userAuth, userCanUpsert], async (req: Request, res: Response) => {});

/**
 * @swagger
 * /api/v1/users:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user
 *     description: Updates an existing user's information. Update operation can only be done by a logged in user that has 'UserUpsert' operational permission.
 *     operationId: updateUser
 *     parameters:
 *       - in: header
 *         name: x-auth-token
 *         required: true
 *         description: Authentication token of the logged in user
 *         schema:
 *           type: string
 *       - in: header
 *         name: entityId
 *         required: true
 *         description: Unique user identification number.
 *         example: 64adc0fe7a9c9d385950dfe2
 *         schema:
 *           type: string
 *     requestBody:
 *       description: User object to update. From the below shown JSON schema exclude "_id", "createdAt" and "updatedAt" fields.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IUserDto'
 *     responses:
 *       '200':
 *         description: User was updated. Updated User object is returned.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IUserDtoReturn'
 *       '401':
 *         description: Access denied. No token provided.
 *       '424':
 *         description: User was updated, but auditing is enabled and the Audit server is not available
 */
router.put('/:id', [userAuth, userCanUpsert], async (req: Request, res: Response) => {
    try {
        const entityId: string = req.params.id;
        logger.info('Updating user with ID: ' + entityId);

        // Ensure product to update exists

        if ((await User.findById(entityId)) === null) {
            throw new RouteHandlingError(404, `User with id ${entityId} not found`);
        }

        let updatedUser: IUserDto = { ...req.body };

        // Prior to saving, validate that the new values conform
        // to our validation rules.
        validateUser(updatedUser);

        /**
         * If a password was provided, encrypt it before the user object
         * is updated in the database
         */
        if (updatedUser.password?.length > 0) {
            validatePassword(updatedUser.password);

            const password = await encryptPassword(updatedUser.password);
            updatedUser.password = password;
        }

        // Everything checks out. Save the product and return
        // update product JSON node
        let user = await User.findByIdAndUpdate(entityId, updatedUser, { new: true });
        user = user.toObject();
        user = _.omit(user, 'password');

        logger.info('User was updated. entityId: ' + entityId);
        logger.debug(JSON.stringify(user));

        const success = await auditAuthUserActivity(req as RequestDto, HttpMethod.Put, 'Updated user: ' + JSON.stringify(user));

        if (success === false) {
            throw new RouteHandlingError(424, AuditError);
        }

        return res.status(200).json(user);
    } catch (ex) {
        const error = RouteErrorFormatter(ex, __filename, 'Fatal error User PUT');
        logger.error(error.message);
        return res.status(error.httpStatus).send(error.message);
    }
});

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user information about self
 *     description: A logged in user can obtain information about itself
 *     operationId: getSelfUserInfo
 *     parameters:
 *       - in: header
 *         name: x-auth-token
 *         required: true
 *         description: authentication token of the logged in user
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: successful operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IUserDtoReturn'
 *       '400':
 *         description: Invalid token.
 *       '424':
 *         description: User information was retreived, but auditing is enabled and the Audit server is not available.
 */
router.get('/me', userAuth, async (req: Request, res: Response) => {
    try {
        const reqDto = req as RequestDto;
        let user = await User.findById(reqDto.Jwt.userId);

        if (_.isUndefined(user) === true) {
            throw new RouteHandlingError(400, `User with ID ${reqDto.Jwt.userId} was not found`);
        }

        const dataToSend = JSON.stringify(_.omit(user.toObject(), 'password'));

        const success = await auditAuthUserActivity(req as RequestDto, HttpMethod.Get, 'Read user: ' + JSON.stringify(dataToSend));

        if (success === false) {
            throw new RouteHandlingError(424, AuditError);
        }

        return res.status(200).json(_.omit(user.toObject(), 'password'));
    } catch (ex) {
        const error = RouteErrorFormatter(ex, __filename, 'Fatal error User GET');
        logger.error(error.message);
        return res.status(error.httpStatus).send(error.message);
    }
});

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Filter users based on provided query parameters
 *     description: The user data set can be filtered, sorted to retreive only the entities that are of interest and only those fields that are needed. In case only a subset of fields are requested to be returned, this should be specified in the request BODY in form of a JSON object {"select"&#58; ["_id", "name", "description"]}
 *     operationId: getUserFilter
 *     parameters:
 *       - in: header
 *         name: x-auth-token
 *         required: true
 *         description: authentication token of the logged in user
 *         schema:
 *           type: string
 *       - in: query
 *         name: email
 *         required: false
 *         description: If one specific users information is needed, this can be requested using the known user's email address.
 *         example: email=mickey.mouse@disney.com
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityId
 *         required: false
 *         description: If one specific users information is needed, this can be requested using the unique user ID number.
 *         example: entityId=763862349945
 *         schema:
 *           type: string
 *       - in: query
 *         name: pageSize
 *         required: false
 *         description: Page size of the data data to retrieve.
 *         example: pageSize=10
 *         schema:
 *           type: number
 *       - in: query
 *         name: pageNumber
 *         required: false
 *         description: Page number of the data data to retrieve.
 *         example: pageNumber=1
 *         schema:
 *           type: number
 *       - in: query
 *         name: sortBy
 *         required: false
 *         description: Field name that the returned information should be sorted by.
 *         example: sortBy=lastName
 *         schema:
 *           type: string
 *       - in: query
 *         name: filterByField
 *         required: false
 *         description: Field name that the returned information should be filtered by.
 *         example: filterByField=firstName
 *         schema:
 *           type: string
 *       - in: query
 *         name: filterValue
 *         required: false
 *         description: Value substring that the 'filterByField' is expected to contain.
 *         example: filterValue=Bob will return all matches for strings such as 'Bob', 'Bobby', 'Bobalu', 'Super Bob'
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: JSON object containing standard paging information that allows the UI to easier determine if there are more information and what link to use to get the next or previous page. See the IUsersFilterResponse schema for detailed information.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IUsersFilterResponse'
 *       '400':
 *         description: Invalid token.
 *       '424':
 *         description: User information was retrieved, but auditing is enabled and the Audit server is not available.
 */

router.get('/', [userAuth, userCanList], async (req: Request, res: Response) => {
    try {
        // Information for all users was requested.
        const result = await getUsersByField(req);
        return res.status(200).json(result);
    } catch (ex) {
        const error = RouteErrorFormatter(ex, __filename, 'Fatal error User GET');
        logger.error(error.message);
        return res.status(error.httpStatus).send(error.message);
    }
});

/**
 * @swagger
 * /api/v1/users/findBy:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user information using the user's email address or using the user's unique identifier.
 *     description: A logged in user can obtain information about users only if this user has 'userCanList' operational access rights given to it.
 *     operationId: getUserInfo
 *     parameters:
 *       - in: header
 *         name: x-auth-token
 *         required: true
 *         description: Authentication token of the logged in user
 *         schema:
 *           type: string
 *       - in: query
 *         name: email
 *         required: false
 *         description: Email of the user whose information is requested. Provide this or the user's unique ID number.
 *         example: john.smith@gmail.com
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityId
 *         required: false
 *         description: Unique user id of the user whose information is requested. Provide either this or the the user's email address.
 *         example: 64bf5ba4d0c8d93ad3ea47e3
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Found the requested user. All user details are in the body of the response.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IUserDto'
 *       '400':
 *         description: Invalid token.
 *       '424':
 *         description: User information was retrieved, but auditing is enabled and the Audit server is not available.
 */
router.get('/findBy', [userAuth, userCanList], async (req: Request, res: Response) => {
    try {
        if (_.isUndefined(req.query.entityId) === false) {
            const entityId = req.query.entityId;
            logger.info('Getting user information for user id: ' + entityId);

            let user = await User.findById(entityId);

            if (user === null) {
                throw new RouteHandlingError(400, `User with ID ${entityId} was not found`);
            } else {
                user = user.toObject() as IUserDto;
                user = _.omit(user, 'password');

                logger.info('User found: ' + user!._id);
                logger.debug(JSON.stringify(user));

                const success = await auditAuthUserActivity(req as RequestDto, HttpMethod.Get, 'Read user: ' + user._id);

                if (success === false) {
                    throw new RouteHandlingError(424, AuditError);
                }

                return res.status(200).json(user);
            }
        } else if (_.isUndefined(req.query.email) === false) {
            let user = await User.findOne({
                email: req.query.email,
            });

            if (user === null) {
                throw new RouteHandlingError(400, `User with email ${req.query.email} was not found`);
            } else {
                user = user.toObject() as IUserDto;
                user = _.omit(user, 'password');

                logger.info('User found: ' + user!._id);
                logger.debug(JSON.stringify(user));

                const success = await auditAuthUserActivity(req as RequestDto, HttpMethod.Get, 'Read user: ' + user._id);

                if (success === false) {
                    throw new RouteHandlingError(424, AuditError);
                }

                return res.status(200).json(user);
            }
        } else {
            throw new RouteHandlingError(400, 'Bad request.');
        }
    } catch (ex) {
        const error = RouteErrorFormatter(ex, __filename, 'Fatal error User GET');
        logger.error(error.message);
        return res.status(error.httpStatus).send(error.message);
    }
});

/**
 * @param {req } - Request object so that we can access query parameters
 * @param field - Product object field that we would like to search on. As an example 'upc'
 * @returns touple with HTTP Status code as key and either an error or product
 * object as value.
 */
async function getUsersByField(req: Request): Promise<IEntityReturn<IUserDto>> {
    logger.debug('Inside getProductsByField');

    /**
     * This array is needed so that we know whether to add the regex ignore case
     * option to our search. Ignore case only works with string field types.
     */
    const stringFieldNames: string[] = ['firstName', 'lastName', 'email'];

    const pageNumber: number = req.query.pageNumber ? +req.query.pageNumber : 1;
    const pageSize: number = req.query.pageSize ? +req.query.pageSize : 10;
    const isString: boolean = stringFieldNames.find((f) => f === req.query.filterByField) ? true : false;

    // If the caller requested that all users regardless of whether it is active or deleted should be returned
    // then set isActive to undefined. Otherwise the query parameter is expected to be a Boolean value

    let isActive: boolean | undefined;

    if (req.query.isActive === 'all') {
        isActive = undefined;
    } else if (req.query.isActive === undefined) {
        isActive = true;
    } else {
        isActive = parseBool(req.query.isActive as string);
    }

    const filter = getFilter(req.query.filterByField as string, req.query.filterValue as string, isString, isActive);

    const getFields = selectFields(req.body.select);
    const sortField = getSortField(req.query.sortBy as string);

    logger.debug(`pageNumber: ${pageNumber}`);
    logger.debug(`pageSize: ${pageSize}`);
    logger.debug('filter: ' + JSON.stringify(filter));
    logger.debug('sortField: ' + JSON.stringify(sortField));
    logger.debug('Requested return fields: ' + JSON.stringify(getFields));

    const users = (await User.find(filter, { password: 0 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .sort(sortField)
        .select(getFields)) as IUserDto[];

    const success = await auditAuthUserActivity(req as RequestDto, HttpMethod.Get, 'Read users');

    if (success === false) {
        throw new RouteHandlingError(424, AuditError);
    }

    const fullUrl: string = req.protocol + '://' + req.get('host') + req.originalUrl;
    const response = buildResponse<IUserDto>(fullUrl, pageNumber, pageSize, users);

    logger.debug('Returning: ' + JSON.stringify(response));
    logger.info('Success');
    return response;
}

/**
 * @swagger
 * /api/v1/users:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete a user from the database using its unique entity ID
 *     description: A logged in user can obtain information about users only if this user has 'userCanDelete' operational access rights given to it.
 *     operationId: deleteUser
 *     parameters:
 *       - in: header
 *         name: x-auth-token
 *         required: true
 *         description: Authentication token of the logged in user
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityId
 *         required: true
 *         description: Users unique ID number
 *         example: 64a8c7eb35ae986c434b0b1a
 *         schema:
 *           type: string
 *       - in: query
 *         name: hardDelete
 *         required: false
 *         description: Optional boolean value that specifies whether a soft or a hard delete is requested. By default a soft delete is performed.
 *         example: false
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: User deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IUserDto'
 *       '400':
 *         description: Invalid token.
 *       '404':
 *         description: Not found
 *       '424':
 *         description: User was deleted, but auditing is enabled and the Audit server is not available.
 */
router.delete('/:id', [userAuth, userCanDelete], async (req: Request, res: Response) => {
    try {
        const entityId = req.params.id;
        logger.debug('User entity type delete requested');

        let entity;

        if (req.query.hardDelete === 'true') {
            entity = (await User.findByIdAndDelete(entityId as string)) as IUserDto;
        } else {
            entity = await User.findByIdAndUpdate(entityId, { isActive: false }, { new: true });
        }

        if (_.isUndefined(entity) === true || entity === null) {
            throw new RouteHandlingError(404, `Entity to delete was not found: ${entityId}`);
        } else {
            let msg: string;

            if (req.query.hardDelete === 'true') {
                msg = `User deleted ${entityId}`;
            } else {
                msg = `User marked as inactive ${entityId}`;
            }

            const success = await auditAuthUserActivity(req as RequestDto, HttpMethod.Delete, msg);

            if (success === false) {
                throw new RouteHandlingError(424, AuditError);
            }

            return res.status(200).json(entity);
        }
    } catch (ex) {
        const error = RouteErrorFormatter(ex, __filename, 'Fatal error User DELETE');
        logger.error(error.message);
        return res.status(error.httpStatus).send(error.message);
    }
});

export default router;
